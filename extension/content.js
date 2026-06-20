// GhostLink content script
// Listens for GHOSTLINK_RESULT messages and renders a Shadow DOM warning banner.

(() => {
  const HOST_ID = "ghostlink-banner-host";

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function clampScore(score) {
    const n = Number(score);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, Math.round(n)));
  }

  function removeBanner() {
    const existing = document.getElementById(HOST_ID);
    if (existing) existing.remove();
  }

  function leavePage() {
    if (history.length > 1) {
      history.back();
      // Fallback in case there is no previous entry to navigate to.
      setTimeout(() => {
        if (document.getElementById(HOST_ID)) {
          window.location.href = "about:blank";
        }
      }, 300);
    } else {
      window.location.href = "about:blank";
    }
  }

  const BANNER_STATUSES = new Set(["unsafe", "caution"]);

  function renderBanner(payload) {
    const status = payload && payload.status;

    // "safe" (or any unrecognized status) means there is nothing to warn
    // about - clear a stale banner left over from a previous navigation
    // rather than mis-rendering it as a caution.
    if (!BANNER_STATUSES.has(status)) {
      removeBanner();
      return;
    }

    if (document.getElementById(HOST_ID)) {
      return; // a banner is already present
    }

    const score = clampScore(payload && payload.score);
    const reason = escapeHtml(payload && payload.reason ? payload.reason : "");
    const statusLabel = status === "unsafe" ? "Unsafe" : "Caution";
    const bgColor = status === "unsafe" ? "#E63950" : "#B5790A";

    const host = document.createElement("div");
    host.id = HOST_ID;
    host.style.all = "initial";
    host.style.position = "fixed";
    host.style.top = "0";
    host.style.left = "0";
    host.style.right = "0";
    host.style.zIndex = "2147483647";

    const shadow = host.attachShadow({ mode: "closed" });

    const style = document.createElement("style");
    style.textContent = `
      :host {
        all: initial;
      }
      * {
        box-sizing: border-box;
      }
      .banner {
        font-family: -apple-system, "Segoe UI", system-ui, sans-serif;
        background-color: ${bgColor};
        color: #ffffff;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        width: 100%;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        line-height: 1.4;
      }
      .icon {
        font-size: 22px;
        flex: 0 0 auto;
      }
      .text {
        flex: 1 1 auto;
        min-width: 0;
      }
      .headline {
        font-weight: 700;
        font-size: 14px;
        margin: 0 0 2px 0;
      }
      .reason {
        font-size: 13px;
        margin: 0;
        word-break: break-word;
      }
      .actions {
        flex: 0 0 auto;
        display: flex;
        gap: 8px;
      }
      button {
        font-family: -apple-system, "Segoe UI", system-ui, sans-serif;
        font-size: 13px;
        font-weight: 600;
        border: none;
        border-radius: 4px;
        padding: 8px 12px;
        cursor: pointer;
      }
      .leave-btn {
        background-color: #ffffff;
        color: ${bgColor};
      }
      .leave-btn:hover {
        opacity: 0.9;
      }
      .continue-btn {
        background-color: rgba(255, 255, 255, 0.15);
        color: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.6);
      }
      .continue-btn:hover {
        background-color: rgba(255, 255, 255, 0.25);
      }
    `;

    const wrapper = document.createElement("div");
    wrapper.className = "banner";
    wrapper.innerHTML = `
      <span class="icon" aria-hidden="true">&#128123;</span>
      <div class="text">
        <p class="headline">GhostLink: ${statusLabel} (${score}/100)</p>
        <p class="reason">${reason}</p>
      </div>
      <div class="actions">
        <button type="button" class="leave-btn">Leave this page</button>
        <button type="button" class="continue-btn">I understand, continue</button>
      </div>
    `;

    shadow.appendChild(style);
    shadow.appendChild(wrapper);

    shadow.querySelector(".leave-btn").addEventListener("click", leavePage);
    shadow.querySelector(".continue-btn").addEventListener("click", removeBanner);

    document.documentElement.appendChild(host);
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message && message.type === "GHOSTLINK_RESULT") {
      renderBanner(message.payload || {});
    }
  });
})();
