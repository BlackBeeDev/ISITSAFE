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
