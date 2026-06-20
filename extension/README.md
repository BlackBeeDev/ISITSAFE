# IsItSafe Extension

MVP browser-extension plumbing lives here.

## Load Locally

1. Open Chrome.
2. Go to `chrome://extensions`.
3. Turn on Developer mode.
4. Click Load unpacked.
5. Select this `extension` folder.

## Current Plumbing

- `manifest.json` defines the Manifest V3 extension.
- `background.js` watches completed tab navigations.
- `content.js` receives scan messages for the page UI.
- Internal browser pages and local development pages are skipped.
- Each scannable page is marked as `scanning` and gets a `...` badge.
- The background worker calls `POST http://localhost:3000/api/scan`.
- The background worker polls `GET http://localhost:3000/api/result?id=...`.
- Per-tab scan state is stored in memory as `scanning`, `safe`, `caution`, `unsafe`, or `error`.
- Completed scans update the badge to `OK`, `?`, `!`, or `ERR`.
- Scan updates are sent to the content script as `SCAN_RESULT`.
- The background worker responds to:
  - `GET_SCAN_STATE`
  - `RESCAN_TAB`

## Content Message Shape

`background.js` sends this message to `content.js` whenever scan state changes:

```js
{
  type: "SCAN_RESULT",
  verdict: "scanning" | "safe" | "caution" | "unsafe" | "error",
  state: {
    status: "scanning" | "safe" | "caution" | "unsafe" | "error",
    verdict: "scanning" | "safe" | "caution" | "unsafe" | "error",
    url: "https://example.com/",
    scanId: "scan-id-or-null",
    error: "error-message-or-null",
    result: null
  },
  result: null,
  error: null
}
```

For completed scans, `result` contains the API response from
`/api/result?id=...`.

`content.js` re-broadcasts the same payload in the page as a browser event:

```js
window.addEventListener("isitsafe:scan-result", (event) => {
  console.log(event.detail.verdict);
});
```

The API response shapes are documented in
`../docs/extension-api-contract.md`.
