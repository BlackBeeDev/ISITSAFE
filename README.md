# IsItSafe

Basic MVP wiring for a suspicious URL scanner.

## Run locally

```bash
npm install
npm run dev
```

Create `.env.local` from `.env.example` when you are ready to connect real APIs.

## MVP routes

- `/` landing page with scan form
- `/scan` scan page
- `/results/[id]` result page
- `POST /api/scan`
- `GET /api/result?id=...`
- `POST /api/inbound-email`

## Forwarded email scanning

Configure Resend Receiving so forwarded messages for your scan address are sent
to `/api/inbound-email`. Add a Resend webhook for the `email.received` event
that points to `/api/inbound-email`. Resend webhooks include email metadata, then
the app uses `RESEND_API_KEY` to fetch the received email body before scanning
links.

Set `INBOUND_EMAIL_WEBHOOK_SECRET` in production and have the provider send it
as either `x-isitsafe-webhook-secret`, `Authorization: Bearer ...`, or
`?secret=...`.

The endpoint extracts up to three links from the forwarded email, scans them,
and stores a `forwarded_emails` record linked to the generated scan IDs.

## Supabase table

```sql
create table if not exists public.scans (
  id uuid primary key,
  url text not null,
  score integer not null check (score >= 0 and score <= 100),
  status text not null check (status in ('safe', 'unsafe')),
  screenshot text,
  evidence jsonb not null default '[]'::jsonb,
  explanation text not null,
  created_at timestamptz not null default now()
);

create index if not exists scans_created_at_idx
  on public.scans (created_at desc);

alter table public.scans enable row level security;

drop policy if exists "No public scan access" on public.scans;
create policy "No public scan access"
  on public.scans
  for all
  using (false)
  with check (false);
```
