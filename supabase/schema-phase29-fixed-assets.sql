-- Phase 29 — Fixed-asset register + depreciation
--
--   * fixed_assets — asset register; straight-line depreciation is derived in
--     the app, and a depreciation run posts journals to the GL.
--   * also seeds two chart-of-accounts entries depreciation needs:
--       1590 Accumulated Depreciation (Asset), 6150 Depreciation (Expense).
--
-- Idempotent — safe to re-run.

create table if not exists public.fixed_assets (
  id text primary key,
  asset_number text not null,
  name text not null default '',
  category text not null default '',
  acquisition_date text not null default '',
  cost numeric(16, 2) not null default 0,
  residual_value numeric(16, 2) not null default 0,
  useful_life_years numeric(8, 2) not null default 0,
  depreciation_method text not null default 'Straight Line',
  status text not null default 'Active',          -- Active | Disposed
  depreciation_posted_to_date text not null default '',
  disposal_date text not null default '',
  disposal_proceeds numeric(16, 2) not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists fixed_assets_status_idx on public.fixed_assets(status);
create index if not exists fixed_assets_category_idx on public.fixed_assets(category);

alter table public.fixed_assets enable row level security;

drop policy if exists fixed_assets_select on public.fixed_assets;
create policy fixed_assets_select on public.fixed_assets for select to authenticated using (true);
drop policy if exists fixed_assets_insert on public.fixed_assets;
create policy fixed_assets_insert on public.fixed_assets for insert to authenticated with check (true);
drop policy if exists fixed_assets_update on public.fixed_assets;
create policy fixed_assets_update on public.fixed_assets for update to authenticated using (true) with check (true);
drop policy if exists fixed_assets_delete on public.fixed_assets;
create policy fixed_assets_delete on public.fixed_assets for delete to authenticated using (true);

-- Depreciation accounts (only added if the ledger_accounts table exists from phase 24).
insert into public.ledger_accounts (id, code, name, type, sub_type, vat_applicable, active, notes) values
  ('acct-1590', '1590', 'Accumulated Depreciation', 'Asset',   'Fixed Asset', false, true, ''),
  ('acct-6150', '6150', 'Depreciation',             'Expense', 'Overheads',   false, true, '')
on conflict (id) do nothing;

notify pgrst, 'reload schema';
