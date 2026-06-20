const API_BASE_URL = "http://localhost:3000";
const RECENT_SCAN_WINDOW_MS = 30_000;
const START_SCAN_TIMEOUT_MS = 15_000;
const RESULT_POLL_TIMEOUT_MS = 8_000;
const RESULT_POLL_INTERVAL_MS = 1_000;
const RESULT_POLL_ATTEMPTS = 10;

const tabStates = new Map();
const recentScans = new Map();
const activeScans = new Map();

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeBackgroundColor({ color: "#64748b" });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") {
    return;
  }

  const url = tab.url || changeInfo.url;
  const decision = getScanDecision(url);

  if (!decision.shouldScan) {
    clearTabState(tabId);
    return;
  }

  if (wasRecentlyScanned(tabId, decision.normalizedUrl)) {
    return;
  }

  startScan(tabId, decision.normalizedUrl);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  tabStates.delete(tabId);
  recentScans.delete(tabId);
  activeScans.delete(tabId);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "GET_SCAN_STATE") {
    const tabId = message.tabId ?? sender.tab?.id;
    sendResponse({
      state: typeof tabId === "number" ? tabStates.get(tabId) ?? null : null
    });
    return;
  }

  if (message?.type === "RESCAN_TAB") {
    const tabId = message.tabId ?? sender.tab?.id;
    const url = message.url ?? sender.tab?.url;
    const decision = getScanDecision(url);

    if (typeof tabId !== "number" || !decision.shouldScan) {
      sendResponse({ ok: false, error: decision.reason ?? "Cannot scan this tab" });
      return;
    }

    startScan(tabId, decision.normalizedUrl);
    sendResponse({ ok: true });
  }
});

function getScanDecision(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { shouldScan: false, reason: "Missing URL" };
  }

  let url;

  try {
    url = new URL(rawUrl);
  } catch {
    return { shouldScan: false, reason: "Invalid URL" };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { shouldScan: false, reason: "Only HTTP and HTTPS pages are scanned" };
  }

  if (isExtensionUrl(url)) {
    return { shouldScan: false, reason: "Extension pages are skipped" };
  }

  if (isLocalApiUrl(url)) {
    return { shouldScan: false, reason: "Scanner app pages are skipped" };
  }

  if (isLocalDevelopmentUrl(url)) {
    return { shouldScan: false, reason: "Local development pages are skipped" };
  }

  url.hash = "";

  return {
    shouldScan: true,
    normalizedUrl: url.toString()
  };
}

function isExtensionUrl(url) {
  return url.protocol === "chrome-extension:" || url.protocol === "moz-extension:";
}

function isLocalApiUrl(url) {
  const apiUrl = new URL(API_BASE_URL);
  return url.hostname === apiUrl.hostname && url.port === apiUrl.port;
}

function isLocalDevelopmentUrl(url) {
  return (
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname.endsWith(".localhost")
  );
}

function wasRecentlyScanned(tabId, normalizedUrl) {
  const previous = recentScans.get(tabId);
  const now = Date.now();

  return (
    previous?.url === normalizedUrl &&
    now - previous.startedAt < RECENT_SCAN_WINDOW_MS
  );
}

async function startScan(tabId, normalizedUrl) {
  const startedAt = Date.now();
  const scanToken = crypto.randomUUID();

  recentScans.set(tabId, {
    url: normalizedUrl,
    startedAt
  });

  activeScans.set(tabId, scanToken);

  setTabState(tabId, {
    status: "scanning",
    verdict: "scanning",
    url: normalizedUrl,
    startedAt,
    scanId: null,
    error: null,
    result: null
  });

  updateBadgeForVerdict(tabId, "scanning");
  sendScanMessage(tabId);

  try {
    const scanId = await requestScan(normalizedUrl);

    if (!isCurrentScan(tabId, scanToken)) {
      return;
    }

    setTabState(tabId, {
      status: "scanning",
      verdict: "scanning",
      url: normalizedUrl,
      startedAt,
      scanId,
      error: null,
      result: null
    });

    sendScanMessage(tabId);

    const result = await pollScanResult(scanId);

    if (!isCurrentScan(tabId, scanToken)) {
      return;
    }

    const verdict = normalizeVerdict(result);

    setTabState(tabId, {
      status: verdict,
      verdict,
      url: normalizedUrl,
      startedAt,
      completedAt: Date.now(),
      scanId,
      error: null,
      result
    });

    updateBadgeForVerdict(tabId, verdict);
    sendScanMessage(tabId);
  } catch (error) {
    if (!isCurrentScan(tabId, scanToken)) {
      return;
    }

    setTabState(tabId, {
      status: "error",
      verdict: "error",
      url: normalizedUrl,
      startedAt,
      completedAt: Date.now(),
      scanId: null,
      error: error instanceof Error ? error.message : "Scan failed",
      result: null
    });

    updateBadgeForVerdict(tabId, "error");
    sendScanMessage(tabId);
  } finally {
    if (isCurrentScan(tabId, scanToken)) {
      activeScans.delete(tabId);
    }
  }
}

async function requestScan(url) {
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/api/scan`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url })
    },
    START_SCAN_TIMEOUT_MS
  );

  const data = await readJson(response);

  if (!response.ok) {
    throw new Error(data?.error || "Scan request failed");
  }

  if (!data?.id || typeof data.id !== "string") {
    throw new Error("Scan response did not include an id");
  }

  return data.id;
}

async function pollScanResult(scanId) {
  let lastError = null;

  for (let attempt = 0; attempt < RESULT_POLL_ATTEMPTS; attempt++) {
    try {
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/api/result?id=${encodeURIComponent(scanId)}`,
        {},
        RESULT_POLL_TIMEOUT_MS
      );
      const data = await readJson(response);

      if (response.ok) {
        if (!isValidScanResult(data)) {
          throw new Error("Scan result response was malformed");
        }

        return data;
      }

      lastError = new Error(data?.error || "Scan result is not ready");
    } catch (error) {
      lastError = error;
    }

    await sleep(RESULT_POLL_INTERVAL_MS);
  }

  throw lastError instanceof Error ? lastError : new Error("Scan result timed out");
}

function isValidScanResult(data) {
  return (
    data &&
    typeof data.id === "string" &&
    typeof data.url === "string" &&
    typeof data.score === "number" &&
    (data.status === "safe" || data.status === "unsafe") &&
    typeof data.explanation === "string"
  );
}

function normalizeVerdict(result) {
  if (result.status === "unsafe" || result.score >= 70) {
    return "unsafe";
  }

  if (result.score >= 35) {
    return "caution";
  }

  return "safe";
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, {
    ...options,
    signal: controller.signal
  }).finally(() => clearTimeout(timeoutId));
}

function isCurrentScan(tabId, scanToken) {
  return activeScans.get(tabId) === scanToken;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function clearTabState(tabId) {
  tabStates.delete(tabId);
  activeScans.delete(tabId);
  chrome.action.setBadgeText({ tabId, text: "" });
}

function setTabState(tabId, state) {
  tabStates.set(tabId, state);
}

function setBadge(tabId, text, color) {
  chrome.action.setBadgeText({ tabId, text });
  chrome.action.setBadgeBackgroundColor({ tabId, color });
}

function updateBadgeForVerdict(tabId, verdict) {
  if (verdict === "scanning") {
    setBadge(tabId, "...", "#64748b");
    return;
  }

  if (verdict === "safe") {
    setBadge(tabId, "OK", "#16a34a");
    return;
  }

  if (verdict === "caution") {
    setBadge(tabId, "?", "#f59e0b");
    return;
  }

  if (verdict === "unsafe") {
    setBadge(tabId, "!", "#dc2626");
    return;
  }

  if (verdict === "error") {
    setBadge(tabId, "ERR", "#6b7280");
  }
}

function sendScanMessage(tabId) {
  const state = tabStates.get(tabId);

  if (!state) {
    return;
  }

  chrome.tabs.sendMessage(tabId, {
    type: "SCAN_RESULT",
    verdict: state.verdict,
    state,
    result: state.result,
    error: state.error
  }).catch(() => {});
}
