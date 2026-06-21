// Screenshots are deliberately left out of the result id token (see
// services/token.ts) because they're too large for a URL. This stashes the
// screenshot the scan just captured in sessionStorage so the results page
// can still show it immediately after a scan, without needing a database.
function key(id: string) {
  return `isitsafe:screenshot:${id}`;
}

export function cacheScreenshot(id: string, screenshot: string | null) {
  if (!screenshot) return;
  try {
    sessionStorage.setItem(key(id), screenshot);
  } catch {
    // sessionStorage can throw in private browsing - the result still
    // renders, it just won't have the screenshot.
  }
}

export function readCachedScreenshot(id: string): string | null {
  try {
    return sessionStorage.getItem(key(id));
  } catch {
    return null;
  }
}
