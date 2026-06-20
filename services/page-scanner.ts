import type { PageSnapshot } from "@/services/types";

export async function scanPage(url: string): Promise<PageSnapshot> {
  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({ headless: true });
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
