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

## Supabase table

```sql
create table scans (
  id uuid primary key,
  url text not null,
  score integer not null,
  status text not null,
  screenshot text,
  explanation text not null,
  created_at timestamptz not null default now()
);
```
