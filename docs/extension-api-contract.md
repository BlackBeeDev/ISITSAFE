# Extension API Contract

This is the contract the browser extension should use for the MVP.

## Base URL

Local development:

```text
http://localhost:3000
```

Production/demo deployments should keep the same route shapes.

## Start a Scan

```http
POST /api/scan
Content-Type: application/json
```

Request body:

```json
{
  "url": "https://example.com/login"
}
```

Success response:

```json
{
  "id": "scan-id"
}
```

Error response:

```json
{
  "error": "URL is required"
}
```

Notes:

- The current server runs the scan before returning the ID.
- The extension should still treat this as an asynchronous job and fetch the result by ID.
- Add a client-side timeout so the extension never hangs if scanning is slow.

## Get a Scan Result

```http
GET /api/result?id=scan-id
```

Success response:

```json
{
  "id": "scan-id",
  "url": "https://example.com/login",
  "score": 72,
  "status": "unsafe",
  "screenshot": "data:image/png;base64,...",
  "explanation": "The page asks for a password and has suspicious signals.",
  "created_at": "2026-06-20T20:00:00.000Z"
}
```

Error response:

```json
{
  "error": "Result not found"
}
```

## Extension Verdict Mapping

The API currently returns `safe` or `unsafe`. The extension can derive a `caution`
state from the numeric score:

```text
score < 35    -> safe
score 35-69   -> caution
score >= 70   -> unsafe
API failure   -> error
```

## CORS

Both API routes allow cross-origin calls for the MVP so a Manifest V3 extension
can call the local Next.js server directly.
