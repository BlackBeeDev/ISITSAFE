let latestScanMessage = null;

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type !== "SCAN_RESULT") {
    return;
  }

  latestScanMessage = message;
  window.dispatchEvent(
    new CustomEvent("isitsafe:scan-result", {
      detail: message
    })
  );
});

chrome.runtime.sendMessage({ type: "GET_SCAN_STATE" }, (response) => {
  if (chrome.runtime.lastError) {
    return;
  }

  if (!response?.state) {
    return;
  }

  latestScanMessage = {
    type: "SCAN_RESULT",
    verdict: response.state.verdict,
    state: response.state,
    result: response.state.result,
    error: response.state.error
  };

  window.dispatchEvent(
    new CustomEvent("isitsafe:scan-result", {
      detail: latestScanMessage
    })
  );
});

window.addEventListener("isitsafe:get-latest-scan", () => {
  window.dispatchEvent(
    new CustomEvent("isitsafe:scan-result", {
      detail: latestScanMessage
    })
  );
});
