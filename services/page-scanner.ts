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
  let browser;
  try {
    browser = await launchBrowser();
  } catch (error) {
    console.error("Browser launch failed", error);
    return { screenshot: null, text: "", reachable: null, navigationError: null };
  }

  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 12000 });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Navigation failed";
      // A plain timeout just means the page was slow to load (common for
      // heavy sites on a cold serverless start) - it doesn't mean the site
      // is actually unreachable, so only DNS/connection-level failures
      // count as confirmed-unreachable.
      const isConfirmedUnreachable = /net::ERR_NAME_NOT_RESOLVED|net::ERR_CONNECTION_REFUSED|net::ERR_CONNECTION_CLOSED|net::ERR_CONNECTION_RESET|net::ERR_ADDRESS_UNREACHABLE|net::ERR_INTERNET_DISCONNECTED/.test(
        message
      );

      return {
        screenshot: null,
        text: "",
        reachable: isConfirmedUnreachable ? false : null,
        navigationError: message
      };
    }

    const text = await page.locator("body").innerText({ timeout: 3000 }).catch(() => "");
    const screenshotBuffer = await page.screenshot({
      fullPage: false,
      type: "png"
    });

    return {
      screenshot: `data:image/png;base64,${screenshotBuffer.toString("base64")}`,
      text,
      reachable: true,
      navigationError: null
    };
  } catch (error) {
    console.error("Playwright scan failed", error);
    return { screenshot: null, text: "", reachable: null, navigationError: null };
  } finally {
    await browser.close().catch(() => {});
  }
}
