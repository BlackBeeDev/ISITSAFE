import { execFile } from "child_process";
import path from "path";
import type { PageSnapshot } from "@/services/types";

export async function scanPage(url: string): Promise<PageSnapshot> {
  try {
    const snapshot = process.env.VERCEL
      ? await captureInServerlessBrowser(url)
      : await captureInChildProcess(url);

    if (!snapshot.screenshot) {
      return {
        ...snapshot,
        screenshot: createFailurePreview(url, snapshot.error ?? "Screenshot unavailable")
      };
    }

    return snapshot;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Page could not be reached";
    console.error("Playwright scan failed", message);

    return {
      screenshot: createFailurePreview(url, message),
      video: null,
      text: "",
      captured: false,
      error: message
    };
  }
}

function captureInChildProcess(url: string) {
  const scriptPath = path.join(process.cwd(), "scripts", "capture-page.cjs");

  return new Promise<PageSnapshot>((resolve, reject) => {
    execFile(
      process.execPath,
      [scriptPath, url],
      { timeout: 22000, maxBuffer: 24 * 1024 * 1024 },
      (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }

        try {
          resolve(JSON.parse(stdout) as PageSnapshot);
        } catch {
          reject(new Error("Screenshot worker returned invalid output"));
        }
      }
    );
  });
}

async function captureInServerlessBrowser(url: string): Promise<PageSnapshot> {
  const [{ default: chromium }, { chromium: playwrightCore }] = await Promise.all([
    import("@sparticuz/chromium"),
    import("playwright-core")
  ]);

  let browser;

  try {
    browser = await playwrightCore.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true
    });

    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 12000
    });

    await page.waitForTimeout(900).catch(() => undefined);
    await renderServerlessOverlay(
      page,
      "IsItSafe safe preview",
      "Opened in an isolated browser. Video replay is available in local demo mode."
    );
    await highlightServerlessRiskyElements(page);

    const text = await page.locator("body").innerText({ timeout: 3000 }).catch(() => "");
    const screenshot = await page.screenshot({ fullPage: false, type: "png" });

    return {
      captured: true,
      screenshot: `data:image/png;base64,${screenshot.toString("base64")}`,
      video: null,
      text,
      error:
        response && response.status() >= 400
          ? `Page returned HTTP ${response.status()}`
          : null
    };
  } finally {
    if (browser) {
      await browser.close().catch(() => undefined);
    }
  }
}

async function renderServerlessOverlay(
  page: { evaluate: (fn: (args: { title: string; body: string }) => void, args: { title: string; body: string }) => Promise<unknown> },
  title: string,
  body: string
) {
  await page
    .evaluate(
      ({ title, body }) => {
        const overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.left = "24px";
        overlay.style.bottom = "24px";
        overlay.style.zIndex = "2147483647";
        overlay.style.maxWidth = "460px";
        overlay.style.borderRadius = "14px";
        overlay.style.background = "rgba(15, 23, 42, 0.92)";
        overlay.style.color = "#ffffff";
        overlay.style.boxShadow = "0 18px 48px rgba(15, 23, 42, 0.35)";
        overlay.style.padding = "16px 18px";
        overlay.style.fontFamily = "Arial, sans-serif";
        overlay.style.lineHeight = "1.45";

        const heading = document.createElement("div");
        heading.textContent = title;
        heading.style.fontSize = "16px";
        heading.style.fontWeight = "800";
        heading.style.marginBottom = "4px";

        const copy = document.createElement("div");
        copy.textContent = body;
        copy.style.fontSize = "14px";
        copy.style.color = "#dbeafe";

        overlay.appendChild(heading);
        overlay.appendChild(copy);
        document.documentElement.appendChild(overlay);
      },
      { title, body }
    )
    .catch(() => undefined);
}

async function highlightServerlessRiskyElements(page: {
  evaluate: (fn: () => void) => Promise<unknown>;
}) {
  await page
    .evaluate(() => {
      const candidates = Array.from(
        document.querySelectorAll("input, button, a, [role='button']")
      ).slice(0, 12);

      for (const el of candidates) {
        const text = `${el.textContent || ""} ${el.getAttribute("aria-label") || ""} ${el.getAttribute("placeholder") || ""}`.toLowerCase();
        const type = `${el.getAttribute("type") || ""}`.toLowerCase();
        const risky =
          type === "password" ||
          text.includes("password") ||
          text.includes("login") ||
          text.includes("sign in") ||
          text.includes("verify") ||
          text.includes("account") ||
          text.includes("pay");

        if (risky && el instanceof HTMLElement) {
          el.style.outline = "4px solid #ef4444";
          el.style.outlineOffset = "3px";
          el.style.boxShadow = "0 0 0 6px rgba(239, 68, 68, 0.18)";
        }
      }
    })
    .catch(() => undefined);
}

function createFailurePreview(url: string, message: string) {
  const host = safeText(new URL(url).hostname);
  const safeMessage = safeText(message);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
      <rect width="1280" height="720" fill="#f8fafc"/>
      <rect x="80" y="82" width="1120" height="556" rx="18" fill="#ffffff" stroke="#cbd5e1" stroke-width="3"/>
      <rect x="80" y="82" width="1120" height="78" rx="18" fill="#e2e8f0"/>
      <circle cx="126" cy="121" r="12" fill="#ef4444"/>
      <circle cx="164" cy="121" r="12" fill="#f59e0b"/>
      <circle cx="202" cy="121" r="12" fill="#22c55e"/>
      <rect x="260" y="104" width="760" height="34" rx="17" fill="#ffffff"/>
      <text x="290" y="127" font-family="Arial, sans-serif" font-size="18" fill="#475569">${host}</text>
      <text x="140" y="306" font-family="Arial, sans-serif" font-size="42" font-weight="700" fill="#0f172a">Screenshot unavailable</text>
      <text x="140" y="364" font-family="Arial, sans-serif" font-size="26" fill="#475569">${safeMessage}</text>
      <text x="140" y="424" font-family="Arial, sans-serif" font-size="22" fill="#64748b">IsItSafe could not open this page in the demo browser.</text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function safeText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
