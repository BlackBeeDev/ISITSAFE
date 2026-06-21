// ISITSAFE - Company Sender Verification
// Detects the visible sender of an email/message on the page and checks it
// against a company-approved trust list, flagging unknown senders and
// lookalike-domain impersonation attempts. Runs independently of the
// existing link-scanning banner in content.js.

(() => {
  const BADGE_HOST_ID = "isitsafe-sender-badge-host";
  const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

  // Mock trust list for the MVP. getTrustList() is the only thing that
  // needs to change to swap this for a Supabase table or API call later -
  // everything downstream just consumes { officialDomain, senders, lookalikeDomains }.
  const MOCK_TRUST_CONFIG = {
    officialDomain: "company.com",
    senders: ["ceo@company.com", "hr@company.com", "finance@company.com", "it@company.com"],
    lookalikeDomains: ["company-security.com", "company-payroll.com", "company-login.com"],
  };

  async function getTrustList() {
    // TODO: replace with e.g. `const res = await fetch(`${API_BASE}/api/trust-list`); return res.json();`
    return MOCK_TRUST_CONFIG;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function textOf(el) {
    return el && el.textContent ? el.textContent.trim() : "";
  }

  // --- extraction ---

  function findSenderCandidateElements() {
    // Covers common webmail markup (Gmail's email="" attribute, Outlook Web
    // / Yahoo aria-labels) plus generic fallbacks for any page that marks up
    // a "from" field with a recognizable class/attribute name.
    const selectors = [
      "[email]",
      "[data-testid='SenderInfo']",
      "[aria-label*='From' i]",
      "[class*='sender' i]",
      "[class*='from' i]",
      "header [class*='author' i]",
    ];
    const found = [];
    selectors.forEach((sel) => {
      try {
        document.querySelectorAll(sel).forEach((el) => found.push(el));
      } catch {
        // unsupported selector in this environment, skip it
      }
    });
    return found;
  }

  function extractSender() {
    const withEmailAttr = document.querySelector("[email]");
    if (withEmailAttr) {
      const email = withEmailAttr.getAttribute("email");
      if (email && EMAIL_RE.test(email)) {
        return { email: email.toLowerCase(), name: textOf(withEmailAttr) || email };
      }
    }

    for (const el of findSenderCandidateElements()) {
      const text = textOf(el);
      const match = text.match(EMAIL_RE);
      if (match) {
        return { email: match[0].toLowerCase(), name: text.replace(match[0], "").trim() || match[0] };
      }
    }

    const mailtoLink = document.querySelector("a[href^='mailto:' i]");
    if (mailtoLink) {
      const email = mailtoLink.href.replace(/^mailto:/i, "").split("?")[0].trim();
      if (EMAIL_RE.test(email)) {
        return { email: email.toLowerCase(), name: textOf(mailtoLink) || email };
      }
    }

    return null;
  }

  function extractLinks() {
    return Array.from(document.querySelectorAll("a[href]"))
      .map((a) => a.href)
      .filter((href) => /^https?:\/\//i.test(href));
  }

  function extractReplyTo() {
    const el = document.querySelector("[aria-label*='Reply-To' i], [class*='reply-to' i]");
    const match = textOf(el).match(EMAIL_RE);
    return match ? match[0].toLowerCase() : null;
  }

  // --- verification ---

  function getDomain(email) {
    const at = email.lastIndexOf("@");
    return at === -1 ? "" : email.slice(at + 1).toLowerCase();
  }

  function levenshtein(a, b) {
    const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        dp[i][j] = a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
    return dp[a.length][b.length];
  }

  function detectLookalikeDomain(domain, trustConfig) {
    if (!domain || domain === trustConfig.officialDomain) return null;

    if (trustConfig.lookalikeDomains.includes(domain)) {
      return { reason: "known-lookalike", detail: `${domain} is a known impersonation domain` };
    }

    const companyName = trustConfig.officialDomain.split(".")[0];
    if (domain.includes(companyName)) {
      return { reason: "contains-company-name", detail: `${domain} contains "${companyName}" but is not the official domain` };
    }

    const distance = levenshtein(domain, trustConfig.officialDomain);
    if (distance > 0 && distance <= 2) {
      return { reason: "misspelling", detail: `${domain} is suspiciously close to ${trustConfig.officialDomain} (possible misspelling)` };
    }

    return null;
  }

  function verifySender(sender, trustConfig, replyTo) {
    if (!sender || !sender.email) {
      return { status: "unknown", reason: "No sender could be identified on this page." };
    }

    const domain = getDomain(sender.email);

    if (trustConfig.senders.includes(sender.email)) {
      if (replyTo && replyTo !== sender.email) {
        return {
          status: "impersonation",
          reason: `The sender address is on the approved list, but the reply-to address (${replyTo}) does not match it - a common impersonation trick.`,
        };
      }
      return { status: "verified", reason: `${sender.email} is on the approved company sender list.` };
    }

    const lookalike = detectLookalikeDomain(domain, trustConfig);
    if (lookalike) {
      return {
        status: "impersonation",
        reason: `This sender claims to be from your company, but ${lookalike.detail}.`,
      };
    }

    if (domain === trustConfig.officialDomain) {
      return {
        status: "unknown",
        reason: `${sender.email} uses the official company domain but is not yet on the approved sender list.`,
      };
    }

    return {
      status: "unknown",
      reason: `${sender.email} is not on the approved company sender list and is not from the company domain.`,
    };
  }

  // --- UI ---

  const STATUS_CONFIG = {
    verified: { label: "Verified Sender", color: "#1f7a3d", bg: "#e6f4ea" },
    unknown: { label: "Unknown Sender", color: "#8a6500", bg: "#fff6e0" },
    impersonation: { label: "Possible Impersonation", color: "#ffffff", bg: "#d93025" },
  };

  function removeBadge() {
    const existing = document.getElementById(BADGE_HOST_ID);
    if (existing) existing.remove();
  }

  function renderTrustBadge(result, anchorEl) {
    removeBadge();

    const cfg = STATUS_CONFIG[result.status] || STATUS_CONFIG.unknown;

    const host = document.createElement("div");
    host.id = BADGE_HOST_ID;
    host.style.all = "initial";
    host.style.position = "fixed";
    host.style.zIndex = "2147483647";

    // Sit beside the sender on the same line rather than below it - "below"
    // is fixed-position and doesn't push page content down, so it would
    // otherwise overlap whatever follows (e.g. a subject line).
    const rect = anchorEl && anchorEl.getBoundingClientRect ? anchorEl.getBoundingClientRect() : null;
    if (rect && (rect.top || rect.left)) {
      host.style.top = `${Math.max(0, rect.top - 2)}px`;
      host.style.left = `${Math.max(0, rect.right + 8)}px`;
    } else {
      host.style.top = "8px";
      host.style.left = "8px";
    }

    const shadow = host.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    style.textContent = `
      :host { all: initial; }
      * { box-sizing: border-box; }
      .badge {
        font-family: -apple-system, "Segoe UI", system-ui, sans-serif;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 999px;
        background-color: ${cfg.bg};
        color: ${cfg.color};
        cursor: pointer;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
        border: 1px solid rgba(0, 0, 0, 0.05);
      }
      .panel {
        display: none;
        margin-top: 6px;
        max-width: 280px;
        font-size: 12px;
        font-weight: 400;
        background-color: #ffffff;
        color: #2b2b2b;
        border-radius: 8px;
        padding: 10px 12px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        line-height: 1.4;
      }
      .panel.open { display: block; }
    `;

    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div class="badge" role="button" tabindex="0">IsItSafe: ${escapeHtml(cfg.label)}</div>
      <div class="panel">${escapeHtml(result.reason)}</div>
    `;

    shadow.appendChild(style);
    shadow.appendChild(wrapper);

    const badgeEl = shadow.querySelector(".badge");
    const panelEl = shadow.querySelector(".panel");
    const toggle = () => panelEl.classList.toggle("open");
    badgeEl.addEventListener("click", toggle);
    badgeEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") toggle();
    });

    document.documentElement.appendChild(host);
  }

  // --- orchestration ---

  let lastSenderEmail = null;

  async function runSenderCheck() {
    const sender = extractSender();
    if (!sender) {
      removeBadge();
      lastSenderEmail = null;
      return;
    }
    if (sender.email === lastSenderEmail) return;
    lastSenderEmail = sender.email;

    const trustConfig = await getTrustList();
    const replyTo = extractReplyTo();
    const result = verifySender(sender, trustConfig, replyTo);

    const anchorEl = document.querySelector("[email]") || document.querySelector("a[href^='mailto:' i]");
    renderTrustBadge(result, anchorEl);
  }

  runSenderCheck();

  // Webmail clients (Gmail, Outlook Web) are SPAs that swap message content
  // in place without a navigation, so re-check whenever the DOM changes.
  let debounceTimer = null;
  new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(runSenderCheck, 400);
  }).observe(document.documentElement, { childList: true, subtree: true });

  // Exposed for manual testing and for swapping the trust list source later.
  window.__isitsafeSenderVerify = {
    extractSender,
    extractLinks,
    verifySender,
    detectLookalikeDomain,
    renderTrustBadge,
    getTrustList,
  };
})();
