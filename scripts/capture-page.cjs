const { chromium } = require("playwright");
const fs = require("fs/promises");
const os = require("os");
const path = require("path");

async function main() {
  const url = process.argv[2];
  let browser;

  if (!url) {
    print({ captured: false, screenshot: null, video: null, text: "", error: "URL is required" });
    return;
  }

  let context;
  let videoDir;

  try {
    browser = await chromium.launch({ headless: true });
    videoDir = await fs.mkdtemp(path.join(os.tmpdir(), "isitsafe-replay-"));
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      recordVideo: { dir: videoDir, size: { width: 1280, height: 720 } }
    });
    const page = await context.newPage();
    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 12000
    });
    await page.waitForTimeout(900).catch(() => undefined);
    await renderReplayOverlay(page, "IsItSafe safe replay", "We open the page in an isolated browser so you do not have to.");
    await page.waitForTimeout(1300).catch(() => undefined);
    await highlightRiskyElements(page);
    await page.waitForTimeout(1800).catch(() => undefined);
    await renderReplayOverlay(page, "What to notice", "Red highlights mark login, password, payment, or verification prompts. No data is typed or submitted.");
    await page.waitForTimeout(1700).catch(() => undefined);
    const text = await page.locator("body").innerText({ timeout: 3000 }).catch(() => "");
    const screenshot = await page.screenshot({ fullPage: false, type: "png" });
    const video = await readPageVideo(page, context);

    print({
      captured: true,
      screenshot: `data:image/png;base64,${screenshot.toString("base64")}`,
      video,
      text,
      error:
        response && response.status() >= 400
          ? `Page returned HTTP ${response.status()}`
          : null
    });
  } catch (error) {
    print({
      captured: false,
      screenshot: null,
      video: null,
      text: "",
      error: getReadableScanError(error)
    });
  } finally {
    if (context) {
      await context.close().catch(() => undefined);
    }
    if (browser) {
      await browser.close().catch(() => undefined);
    }
    if (videoDir) {
      await fs.rm(videoDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}

async function renderReplayOverlay(page, title, body) {
  await page
    .evaluate(
      ({ title, body }) => {
        const existing = document.getElementById("isitsafe-replay-overlay");
        if (existing) existing.remove();

        const overlay = document.createElement("div");
        overlay.id = "isitsafe-replay-overlay";
        overlay.setAttribute("aria-label", "IsItSafe replay note");
        overlay.style.position = "fixed";
        overlay.style.left = "24px";
        overlay.style.bottom = "24px";
        overlay.style.zIndex = "2147483647";
        overlay.style.maxWidth = "460px";
        overlay.style.border = "1px solid rgba(148, 163, 184, 0.45)";
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

async function highlightRiskyElements(page) {
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

        if (risky) {
          el.style.outline = "4px solid #ef4444";
          el.style.outlineOffset = "3px";
          el.style.boxShadow = "0 0 0 6px rgba(239, 68, 68, 0.18)";
          el.setAttribute("data-isitsafe-risk-highlight", "true");
        }
      }

      const highlighted = Array.from(document.querySelectorAll("[data-isitsafe-risk-highlight='true']")).slice(0, 3);
      highlighted.forEach((el, index) => {
        const rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        const label = document.createElement("div");
        label.textContent = index === 0 ? "Risky prompt" : "Sensitive action";
        label.style.position = "fixed";
        label.style.left = `${Math.max(8, rect.left)}px`;
        label.style.top = `${Math.max(8, rect.top - 34)}px`;
        label.style.zIndex = "2147483647";
        label.style.borderRadius = "999px";
        label.style.background = "#ef4444";
        label.style.color = "#ffffff";
        label.style.padding = "6px 10px";
        label.style.font = "700 12px Arial, sans-serif";
        label.style.boxShadow = "0 8px 20px rgba(239, 68, 68, 0.28)";
        document.documentElement.appendChild(label);
      });
    })
    .catch(() => undefined);
  const target = await page.locator("[data-isitsafe-risk-highlight='true']").first().boundingBox().catch(() => null);
  if (target) {
    await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2).catch(() => undefined);
  } else {
    await page.mouse.move(420, 260).catch(() => undefined);
  }
  await page.waitForTimeout(800).catch(() => undefined);
}

async function readPageVideo(page, context) {
  const video = page.video();
  if (!video) {
    await context.close().catch(() => undefined);
    return null;
  }

  await page.close().catch(() => undefined);
  await context.close().catch(() => undefined);

  try {
    const videoPath = await video.path();
    const buffer = await fs.readFile(videoPath);
    return `data:video/webm;base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

function print(result) {
  process.stdout.write(JSON.stringify(result));
}

function getReadableScanError(error) {
  const message = error && error.message ? error.message : "Unknown browser error";

  if (message.includes("ERR_NAME_NOT_RESOLVED")) {
    return "Domain could not be resolved";
  }

  if (message.includes("ERR_CONNECTION_REFUSED")) {
    return "Connection was refused";
  }

  if (message.includes("ERR_CONNECTION_TIMED_OUT") || message.includes("Timeout")) {
    return "Page load timed out";
  }

  if (message.includes("ERR_CERT")) {
    return "Certificate error blocked the page";
  }

  if (message.includes("Executable doesn't exist")) {
    return "Playwright browser is not installed";
  }

  return "Page could not be reached or rendered";
}

main();
