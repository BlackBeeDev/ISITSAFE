create table if not exists public.scans (
  id uuid primary key,
  url text not null,
  score integer not null check (score >= 0 and score <= 100),
  status text not null check (status in ('safe', 'unsafe')),
  screenshot text,
  explanation text not null,
  evidence jsonb not null default '[]'::jsonb,
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

create table if not exists public.forwarded_emails (
  id uuid primary key,
  provider text not null,
  message_id text,
  from_email text,
  to_email text,
  subject text,
  body_preview text not null default '',
  detected_urls jsonb not null default '[]'::jsonb,
  scan_ids jsonb not null default '[]'::jsonb,
  status text not null check (status in ('queued', 'scanned', 'no_link', 'failed')),
  error text,
  created_at timestamptz not null default now()
);

create index if not exists forwarded_emails_created_at_idx
  on public.forwarded_emails (created_at desc);

create index if not exists forwarded_emails_status_idx
  on public.forwarded_emails (status);

alter table public.forwarded_emails enable row level security;

drop policy if exists "No public forwarded email access" on public.forwarded_emails;
create policy "No public forwarded email access"
  on public.forwarded_emails
  for all
  using (false)
  with check (false);
