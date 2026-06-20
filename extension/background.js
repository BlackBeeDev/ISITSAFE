// GhostLink background service worker (MV3).
// Tracks the last scan result per tab and handles GET_LAST_RESULT / RESCAN
// messages from the popup by calling the configured API and forwarding the
// result to the tab's content script.

const DEFAULT_API_BASE = "http://localhost:3000";

// Per-tab result cache backed by chrome.storage.session. A plain in-memory
// Map would lose its contents whenever MV3 unloads this service worker
// (which happens frequently and unpredictably), making "last result"
// disappear moments after a scan. storage.session survives worker restarts
// for the life of the browser session while still clearing on browser close.
function storageKey(tabId) {
  return `lastResult:${tabId}`;
}

function getStoredResult(tabId) {
  return new Promise((resolve) => {
    chrome.storage.session.get([storageKey(tabId)], (items) => {
      resolve((items && items[storageKey(tabId)]) || null);
    });
  });
}

function setStoredResult(tabId, result) {
  return chrome.storage.session.set({ [storageKey(tabId)]: result });
}

function clearStoredResult(tabId) {
  return chrome.storage.session.remove([storageKey(tabId)]);
}

function getActiveTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs && tabs[0] ? tabs[0] : null);
    });
  });
}

function getApiBase() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["apiBase"], (items) => {
      resolve((items && items.apiBase) || DEFAULT_API_BASE);
    });
  });
}

async function parseJsonResponse(res, apiBase) {
  try {
    return await res.json();
  } catch {
    throw new Error(`API at ${apiBase} did not return JSON - check the endpoint in settings.`);
  }
}

async function scanUrl(apiBase, url) {
  const scanRes = await fetch(`${apiBase}/api/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const scanBody = await parseJsonResponse(scanRes, apiBase);
  if (!scanRes.ok || !scanBody.id) {
    throw new Error(scanBody.error || "Scan request failed");
  }

  const resultRes = await fetch(`${apiBase}/api/result?id=${encodeURIComponent(scanBody.id)}`);
  const resultBody = await parseJsonResponse(resultRes, apiBase);
  if (!resultRes.ok) {
    throw new Error(resultBody.error || "Fetching scan result failed");
  }

  return {
    status: resultBody.status,
    score: resultBody.score,
    reason: resultBody.explanation || "",
  };
}

async function runScanForTab(tab) {
  if (!tab || !tab.id || !tab.url) {
    return { status: "error", score: null, reason: "No active tab to scan." };
  }
  if (!/^https?:\/\//i.test(tab.url)) {
    return { status: "error", score: null, reason: "This page can't be scanned." };
  }

  const apiBase = await getApiBase();
  try {
    const result = await scanUrl(apiBase, tab.url);
    await setStoredResult(tab.id, result);
    chrome.tabs.sendMessage(tab.id, { type: "GHOSTLINK_RESULT", payload: result }, () => {
      void chrome.runtime.lastError; // ignore if content script isn't present
    });
    return result;
  } catch (error) {
    const result = { status: "error", score: null, reason: error.message || "Scan failed." };
    await setStoredResult(tab.id, result);
    return result;
  }
}

// Auto-scan when a tab finishes loading a new page, so a result/banner is
// already there without the user having to open the popup and click
// "Rescan this page" manually. Tracks the last scanned URL per tab so
// in-page events (title changes, etc.) that don't actually navigate don't
// trigger a repeat scan.
const scannedUrlByTab = new Map();

chrome.tabs.onRemoved.addListener((tabId) => {
  clearStoredResult(tabId);
  scannedUrlByTab.delete(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.url) return;
  if (scannedUrlByTab.get(tabId) === tab.url) return;

  scannedUrlByTab.set(tabId, tab.url);
  runScanForTab(tab);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message.type !== "string") return false;

  if (message.type === "GET_LAST_RESULT") {
    getActiveTab()
      .then((tab) => (tab ? getStoredResult(tab.id) : null))
      .then(sendResponse);
    return true;
  }

  if (message.type === "RESCAN") {
    getActiveTab().then((tab) => runScanForTab(tab)).then(sendResponse);
    return true;
  }

  return false;
});
