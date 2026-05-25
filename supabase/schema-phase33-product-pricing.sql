-- Phase 33 — Standard-product cost-plus pricing
--
--   * products.pricing_enabled / pricing_spec — a standard product carries a
--     saved costing spec (size, paper, handle, print, base qty, MOQ breaks,
--     margin) so its price can be recomputed from the live cost masters.
--   * product_price_versions — versioned, approvable price snapshots: the
--     margin used, the cost assumptions in force, the per-break prices, and who
--     approved it + when. The audit trail behind "why was the price this?".
--   * client_product_prices — per-client overrides (special margin or a fixed
--     agreed unit price), optionally scoped to a minimum quantity.
--
-- All internal/private — none of this is exposed via the Aman OS connector.
-- Idempotent — safe to re-run.

-- ── Products: pricing spec columns ─────────────────────────────────────────
alter table public.products add column if not exists pricing_enabled boolean not null default false;
alter table public.products add column if not exists pricing_spec jsonb;

-- ── Price versions (audit + approval) ──────────────────────────────────────
create table if not exists public.product_price_versions (
  id text primary key,
  product_id text not null,
  product_name text not null default '',
  version_number integer not null default 1,
  status text not null default 'Draft',            -- Draft | Approved | Superseded
  base_margin_percent numeric(10, 2) not null default 0,
  assumptions jsonb not null default '{}'::jsonb,   -- paper rate + cost profile snapshot
  breaks jsonb not null default '[]'::jsonb,        -- [{quantity, unitCost, unitPrice, plateSetupFee}]
  note text not null default '',
  created_at timestamptz not null default now(),
  created_by_name text not null default '',
  approved_at text not null default '',
  approved_by_name text not null default ''
);

create index if not exists product_price_versions_product_idx on public.product_price_versions(product_id);
create index if not exists product_price_versions_status_idx on public.product_price_versions(status);

alter table public.product_price_versions enable row level security;

drop policy if exists product_price_versions_select on public.product_price_versions;
create policy product_price_versions_select on public.product_price_versions for select to authenticated using (true);
drop policy if exists product_price_versions_insert on public.product_price_versions;
create policy product_price_versions_insert on public.product_price_versions for insert to authenticated with check (true);
drop policy if exists product_price_versions_update on public.product_price_versions;
create policy product_price_versions_update on public.product_price_versions for update to authenticated using (true) with check (true);
drop policy if exists product_price_versions_delete on public.product_price_versions;
create policy product_price_versions_delete on public.product_price_versions for delete to authenticated using (true);

-- ── Client-specific deals ──────────────────────────────────────────────────
create table if not exists public.client_product_prices (
  id text primary key,
  client_id text not null,
  client_name text not null default '',
  product_id text not null,
  product_name text not null default '',
  mode text not null default 'margin',             -- margin | fixedPrice
  margin_percent numeric(10, 2) not null default 0,
  fixed_unit_price numeric(16, 4) not null default 0,
  min_quantity numeric(16, 0) not null default 0,
  note text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by_name text not null default ''
);

create index if not exists client_product_prices_client_idx on public.client_product_prices(client_id);
create index if not exists client_product_prices_product_idx on public.client_product_prices(product_id);

alter table public.client_product_prices enable row level security;

drop policy if exists client_product_prices_select on public.client_product_prices;
create policy client_product_prices_select on public.client_product_prices for select to authenticated using (true);
drop policy if exists client_product_prices_insert on public.client_product_prices;
create policy client_product_prices_insert on public.client_product_prices for insert to authenticated with check (true);
drop policy if exists client_product_prices_update on public.client_product_prices;
create policy client_product_prices_update on public.client_product_prices for update to authenticated using (true) with check (true);
drop policy if exists client_product_prices_delete on public.client_product_prices;
create policy client_product_prices_delete on public.client_product_prices for delete to authenticated using (true);

notify pgrst, 'reload schema';
