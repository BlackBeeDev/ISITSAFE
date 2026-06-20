import { execFile } from "child_process";
import path from "path";
import type { PageSnapshot } from "@/services/types";

export async function scanPage(url: string): Promise<PageSnapshot> {
  try {
    const snapshot = await captureInChildProcess(url);

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
      { timeout: 18000, maxBuffer: 8 * 1024 * 1024 },
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
