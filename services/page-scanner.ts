import type { PageSnapshot } from "@/services/types";

// Vercel's serverless functions don't ship Playwright's bundled Chromium
// binary, so launching the regular "playwright" package fails there.
// @sparticuz/chromium provides a binary built for that environment instead;
// locally, the full "playwright" package's own bundled browser is used.
async function launchBrowser() {
  if (process.env.VERCEL) {
    const [{ default: chromium }, { chromium: playwrightCore }] = await Promise.all([
      import("@sparticuz/chromium"),
      import("playwright-core")
    ]);
    return playwrightCore.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true
    });
  }

  const { chromium } = await import("playwright");
  return chromium.launch({ headless: true });
}

export async function scanPage(url: string): Promise<PageSnapshot> {
  try {
    const browser = await launchBrowser();
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 12000 });
    const text = await page.locator("body").innerText({ timeout: 3000 }).catch(() => "");
    const screenshotBuffer = await page.screenshot({
      fullPage: false,
      type: "png"
    });

    await browser.close();

    return {
      screenshot: `data:image/png;base64,${screenshotBuffer.toString("base64")}`,
      text
    };
  } catch (error) {
    console.error("Playwright scan failed", error);
    return {
      screenshot: null,
      text: ""
    };
  }
}
