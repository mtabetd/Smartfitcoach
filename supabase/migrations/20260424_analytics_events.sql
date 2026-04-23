-- Product analytics events — server-side visibility for the business owner
-- Access via Supabase SQL editor or admin API (service role only, no user RLS)
create table if not exists public.analytics_events (
  id bigint generated always as identity primary key,
  session_id text not null,        -- anonymous client session id (uuid v4, no PII)
  user_id uuid,                    -- nullable: set when user is logged in
  event text not null,             -- 'workout_completed', 'meal_logged', etc.
  properties jsonb default '{}',   -- event-specific metadata
  ip_hash text,                    -- sha256 of IP for dedup/abuse (no raw IP stored)
  created_at timestamptz not null default now()
);

create index if not exists idx_analytics_event on public.analytics_events(event, created_at desc);
create index if not exists idx_analytics_session on public.analytics_events(session_id, created_at desc);
create index if not exists idx_analytics_user on public.analytics_events(user_id) where user_id is not null;

-- No RLS: only accessible via service role key (Netlify functions)
-- anon/authenticated roles have zero access
alter table public.analytics_events enable row level security;
create policy "deny_all" on public.analytics_events for all to anon, authenticated using (false) with check (false);
