-- Phase 109.5 — Financial Projections.
--
-- One row per scenario. The whole scenario (assumptions, opening balance
-- sheet, cost lines, capex, funding events) is stored as jsonb because the
-- shape is rich and we never need to query inside it. The engine that
-- consumes it (computeProjection in src/types/index.ts) is pure and runs
-- client-side.
--
-- Identified by the client-side id ('proj-<timestamp>'), not a sequential
-- bigint, so saving from the page is one upsert with no round-trip for the
-- generated id.
--
-- Idempotent: safe to run more than once.

create table if not exists public.financial_projections (
  id text primary key,
  name text not null default 'New scenario',
  description text default '',
  scenario_kind text default 'base',          -- base | optimistic | pessimistic | custom
  horizon_months integer not null default 12,
  start_month date not null,                  -- first day of first period
  accounting_standard text default 'IFRS',    -- IFRS | US_GAAP
  inventory_method text default 'FIFO',       -- FIFO | Weighted Average | LIFO | Specific Identification
  -- Assumption blocks + opening balance sheet + cost/capex/funding lists.
  -- Stored as jsonb so we don't have to chase 30 nested columns.
  revenue jsonb not null default '{}'::jsonb,
  working_capital jsonb not null default '{}'::jsonb,
  tax jsonb not null default '{}'::jsonb,
  opening jsonb not null default '{}'::jsonb,
  cost_lines jsonb not null default '[]'::jsonb,
  capex jsonb not null default '[]'::jsonb,
  funding jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  created_by text default '',
  updated_at timestamptz,
  updated_by text default ''
);

-- Index on scenario_kind for the "compare scenarios" view (Phase 109.4)
-- which buckets scenarios by their tag.
create index if not exists financial_projections_kind_idx
  on public.financial_projections (scenario_kind);

-- Index on created_at for the most-recent-first list on the rail.
create index if not exists financial_projections_created_at_idx
  on public.financial_projections (created_at desc);

alter table public.financial_projections enable row level security;

-- Open to all authenticated users (CEO + accountant + ops). Treat as
-- broadly readable; restricting to admin only would block the accountant
-- from reviewing model assumptions during year-end.
--
-- Note: Postgres does NOT support `create policy if not exists`. The
-- idempotent pattern is `drop policy if exists` followed by `create policy`.
drop policy if exists financial_projections_select on public.financial_projections;
create policy financial_projections_select on public.financial_projections
  for select to authenticated using (true);

drop policy if exists financial_projections_insert on public.financial_projections;
create policy financial_projections_insert on public.financial_projections
  for insert to authenticated with check (true);

drop policy if exists financial_projections_update on public.financial_projections;
create policy financial_projections_update on public.financial_projections
  for update to authenticated using (true) with check (true);

drop policy if exists financial_projections_delete on public.financial_projections;
create policy financial_projections_delete on public.financial_projections
  for delete to authenticated using (true);
