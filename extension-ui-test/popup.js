// GhostLink popup script

const DEFAULT_API_BASE = "http://localhost:3000";
const VALID_STATUSES = new Set(["safe", "caution", "unsafe", "error"]);

const resultCard = document.getElementById("result-card");
const resultStatusEl = document.getElementById("result-status");
const resultScoreEl = document.getElementById("result-score");
const resultReasonEl = document.getElementById("result-reason");
const rescanBtn = document.getElementById("rescan-btn");
const settingsToggle = document.getElementById("settings-toggle");
const settingsPanel = document.getElementById("settings-panel");
const settingsChevron = document.getElementById("settings-chevron");
const apiBaseInput = document.getElementById("api-base-input");
const saveApiBaseBtn = document.getElementById("save-api-base");
const resetApiBaseBtn = document.getElementById("reset-api-base");
const saveStatusEl = document.getElementById("save-status");

function statusLabel(status) {
  switch (status) {
    case "safe":
      return "Safe";
    case "caution":
      return "Caution";
    case "unsafe":
      return "Unsafe";
    case "error":
      return "Error";
    default:
      return "No result yet";
  }
}

function statusClass(status) {
  if (VALID_STATUSES.has(status) && status !== "error") {
    return `result-${status}`;
  }
  return "result-neutral";
}

function renderResult(result) {
  const status = result && VALID_STATUSES.has(result.status) ? result.status : null;
  const score =
    result && result.score !== null && result.score !== undefined && Number.isFinite(Number(result.score))
      ? Math.max(0, Math.min(100, Math.round(Number(result.score))))
      : null;
  const reason = result && typeof result.reason === "string" ? result.reason : "";

  resultCard.classList.remove("result-safe", "result-caution", "result-unsafe", "result-neutral");
  resultCard.classList.add(statusClass(status));

  resultStatusEl.textContent = statusLabel(status);
  resultScoreEl.textContent = score !== null ? `Score: ${score}/100` : "";
  resultReasonEl.textContent = reason;
}

function requestLastResult() {
  renderResult(null);
  resultStatusEl.textContent = "Loading...";
  chrome.runtime.sendMessage({ type: "GET_LAST_RESULT" }, (response) => {
    if (chrome.runtime.lastError) {
      renderResult({ status: "error", reason: chrome.runtime.lastError.message });
      return;
    }
    renderResult(response);
  });
}

function requestRescan() {
  rescanBtn.disabled = true;
  rescanBtn.textContent = "Rescanning...";
  chrome.runtime.sendMessage({ type: "RESCAN" }, (response) => {
    rescanBtn.disabled = false;
    rescanBtn.textContent = "Rescan this page";
    if (chrome.runtime.lastError) {
      renderResult({ status: "error", reason: chrome.runtime.lastError.message });
      return;
    }
    renderResult(response);
  });
}

function loadApiBase() {
  chrome.storage.sync.get(["apiBase"], (items) => {
    apiBaseInput.value = (items && items.apiBase) || DEFAULT_API_BASE;
  });
}

function normalizeApiBase(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return DEFAULT_API_BASE;

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  try {
    return new URL(withProtocol).origin;
  } catch {
    return null;
  }
}

function saveApiBase() {
  const normalized = normalizeApiBase(apiBaseInput.value);
  if (normalized === null) {
    saveStatusEl.style.color = "#E63950";
    saveStatusEl.textContent = "Invalid URL - not saved";
    setTimeout(() => {
      saveStatusEl.textContent = "";
    }, 2000);
    return;
  }

  apiBaseInput.value = normalized;
  chrome.storage.sync.set({ apiBase: normalized }, () => {
    saveStatusEl.style.color = "";
    saveStatusEl.textContent = "Saved";
    setTimeout(() => {
      saveStatusEl.textContent = "";
    }, 1500);
  });
}

function resetApiBase() {
  apiBaseInput.value = DEFAULT_API_BASE;
  saveApiBase();
}

function toggleSettings() {
  const isOpen = !settingsPanel.hidden;
  settingsPanel.hidden = isOpen;
  settingsToggle.setAttribute("aria-expanded", String(!isOpen));
}

rescanBtn.addEventListener("click", requestRescan);
settingsToggle.addEventListener("click", toggleSettings);
saveApiBaseBtn.addEventListener("click", saveApiBase);
resetApiBaseBtn.addEventListener("click", resetApiBase);

document.addEventListener("DOMContentLoaded", () => {
  requestLastResult();
  loadApiBase();
});
