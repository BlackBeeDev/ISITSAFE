# IsItSafe

Suspicious URL scanner: paste a link (or have the browser extension auto-check the
current tab) and get a safe/caution/unsafe verdict, risk score, screenshot preview,
and AI-style explanation.

Live API: https://isitsafe.vercel.app

## Run locally

```bash
npm install
npm run dev
```

Create `.env.local` from `.env.example` when you are ready to connect real APIs:

- `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` - persists scans so
  `/results/[id]` and `GET /api/result` work across requests. Without these,
  scans only live in memory for the lifetime of one server process (fine for
  `npm run dev`, but won't survive across requests on serverless hosting).
- `OPENAI_API_KEY` - generates the explanation sentence. Falls back to a
  templated explanation if unset.
- `GOOGLE_SAFE_BROWSING_API_KEY` / `VIRUSTOTAL_API_KEY` - real reputation
  lookups against the scanned domain. Falls back to a basic URL keyword
  heuristic if unset.

## How scoring works

`services/reputation.ts` extracts the domain from the scanned URL and checks
it against Google Safe Browsing and VirusTotal (when keys are configured),
plus a simple keyword heuristic (e.g. `login`, `verify`, `free`, `gift` in the
URL). The combined score maps to a status:

- `>= 50` - unsafe
- `25-49` - caution
- `< 25` - safe

## How results work

`POST /api/scan` returns the full result inline, and its `id` is actually a
base64url token that encodes the whole result (minus the screenshot, to keep
it short). `GET /api/result?id=...` and `/results/[id]` decode that token
directly - no database lookup required - which is what makes results work on
stateless serverless functions (each request can land on a different
instance with no shared memory). Supabase, if configured, is used as a
write-through history log but is never required for a result to resolve.

## MVP routes

- `/` landing page with scan form
- `/scan` scan page
- `/results/[id]` result page (requires Supabase configured - see above)
- `POST /api/scan` - runs a scan and returns the full result inline
- `GET /api/result?id=...` - looks up a previously persisted result (requires Supabase)

## Browser extension

`extension/` is an MV3 extension that auto-scans every page you navigate to
and shows a warning banner for caution/unsafe results, without needing to
click the extension icon. It talks to the deployed API by default
(`https://isitsafe.vercel.app`); change this under the extension popup's
"API endpoint" section if you're pointing it at a local server instead.

`extension-ui-test/` is a UI-only variant with simulate buttons for testing
the banner/popup styling without a live API.

### Company sender verification

`extension/sender-verify.js` runs alongside the page-scanning content script
and checks whether an email/message's sender is genuinely from your company.
It reads the visible sender name/email (Gmail-style `[email]` attribute,
common "from"/"sender" markup, or a `mailto:` link), then shows a badge next
to it:

- 🟢 **Verified Sender** - the address is on the approved company list
- 🟡 **Unknown Sender** - not on the list and not from the company domain
- 🔴 **Possible Impersonation** - a known lookalike domain, a domain that
  contains the company name but isn't the real one, a likely misspelling of
  the official domain, or a reply-to address that doesn't match an
  otherwise-approved sender

Clicking the badge expands a one-line explanation. The trust list
(`MOCK_TRUST_CONFIG` in `sender-verify.js`) is mocked locally for the MVP -
`getTrustList()` is the single function to swap for a Supabase/API call
later, since everything downstream only depends on its
`{ officialDomain, senders, lookalikeDomains }` shape. Demo pages for manual
testing live in `extension/demo-pages/sender-verified.html`,
`sender-impersonation.html`, and `sender-unknown.html`.

## Deploying

```bash
npx vercel --prod
```

Set the same env vars from `.env.local` in the Vercel project settings
(Project -> Settings -> Environment Variables) so the deployed API has
real reputation/AI/persistence behavior.

## Supabase table

Optional - only needed for scan history. Results work without this because
the result id itself encodes the scan (see "How results work" below).

```sql
create table scans (
  id text primary key,
  url text not null,
  score integer not null,
  status text not null,
  screenshot text,
  explanation text not null,
  created_at timestamptz not null default now()
);
```
