const { chromium } = require("playwright");

async function main() {
  const url = process.argv[2];
  let browser;

  if (!url) {
    print({ captured: false, screenshot: null, text: "", error: "URL is required" });
    return;
  }

  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 12000
    });
    const text = await page.locator("body").innerText({ timeout: 3000 }).catch(() => "");
    const screenshot = await page.screenshot({ fullPage: false, type: "png" });

    print({
      captured: true,
      screenshot: `data:image/png;base64,${screenshot.toString("base64")}`,
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
      text: "",
      error: getReadableScanError(error)
    });
  } finally {
    if (browser) {
      await browser.close().catch(() => undefined);
    }
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
