-- Phase 32 — Aman OS Connector (publisher side)
--
--   * connector_feed — a single curated snapshot row ('current') holding the
--     published metric tiles (jsonb). Refreshed on every app sync. Never raw rows.
--   * app_settings.connector_config — jsonb: enabled + which tiles are toggled off.
--
-- An external OS reads this only through the `connector-feed` edge function with
-- a shared key; it has no direct table access. Idempotent — safe to re-run.

create table if not exists public.connector_feed (
  id text primary key default 'current',
  tiles jsonb not null default '[]'::jsonb,
  contract_version integer not null default 1,
  published_at timestamptz not null default now()
);

alter table public.connector_feed enable row level security;

-- The JomoPak app (authenticated) writes/reads the snapshot. The edge function
-- uses the service role, which bypasses RLS, to serve external reads.
drop policy if exists connector_feed_select on public.connector_feed;
create policy connector_feed_select on public.connector_feed for select to authenticated using (true);
drop policy if exists connector_feed_insert on public.connector_feed;
create policy connector_feed_insert on public.connector_feed for insert to authenticated with check (true);
drop policy if exists connector_feed_update on public.connector_feed;
create policy connector_feed_update on public.connector_feed for update to authenticated using (true) with check (true);

alter table public.app_settings add column if not exists connector_config jsonb
  not null default '{"enabled":true,"disabledTileKeys":[],"contractVersion":1,"lastPublishedAt":""}'::jsonb;

notify pgrst, 'reload schema';
