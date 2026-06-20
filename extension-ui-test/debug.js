// =====================================================================
// GHOSTLINK DEBUG PANEL — dev-only script.
//
// Sends hardcoded GHOSTLINK_RESULT payloads directly to the active tab's
// content script via chrome.tabs.sendMessage, bypassing the background
// service worker and the scan API entirely. For local UI testing only.
//
// To remove this feature completely, delete:
//   - this file (debug.js)
//   - debug.css
//   - the #ghostlink-debug <section> block in popup.html
//   - the <link rel="stylesheet" href="debug.css" /> tag in popup.html
//   - the <script src="debug.js"></script> tag in popup.html
// Nothing else in the extension depends on this file.
// =====================================================================

(() => {
  const DEBUG_PAYLOADS = {
    safe: {
      status: "safe",
      score: 92,
      reason: "No suspicious redirects, domain registered 8+ years ago, valid TLS certificate.",
    },
    caution: {
      status: "caution",
      score: 54,
      reason: "Domain registered within the last 30 days and uses a free hosting provider.",
    },
    unsafe: {
      status: "unsafe",
      score: 12,
      reason: "Page mimics a known bank login form and requests credentials over an unencrypted form action.",
    },
  };

  const debugStatusEl = document.getElementById("debug-status");

  function setDebugStatus(message) {
    if (!debugStatusEl) return;
    debugStatusEl.textContent = message;
    setTimeout(() => {
      debugStatusEl.textContent = "";
    }, 2000);
  }

  function simulate(kind) {
    const payload = DEBUG_PAYLOADS[kind];
    if (!payload) return;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs && tabs[0];
      if (!activeTab || activeTab.id === undefined) {
        setDebugStatus("No active tab found");
        return;
      }

      chrome.tabs.sendMessage(
        activeTab.id,
        { type: "GHOSTLINK_RESULT", payload },
        () => {
          if (chrome.runtime.lastError) {
            setDebugStatus(`Failed: ${chrome.runtime.lastError.message}`);
            return;
          }
          setDebugStatus(`Sent "${kind}" to tab ${activeTab.id}`);
        }
      );
    });
  }

  const safeBtn = document.getElementById("debug-simulate-safe");
  const cautionBtn = document.getElementById("debug-simulate-caution");
  const unsafeBtn = document.getElementById("debug-simulate-unsafe");

  if (safeBtn) safeBtn.addEventListener("click", () => simulate("safe"));
  if (cautionBtn) cautionBtn.addEventListener("click", () => simulate("caution"));
  if (unsafeBtn) unsafeBtn.addEventListener("click", () => simulate("unsafe"));
})();
// ===== GHOSTLINK DEBUG PANEL SCRIPT END =====
