-- Phase 13 — Spares & Consumables: extend spare_parts + add stock_issues
-- and stock_counts (with line items). This unlocks per-job consumption
-- tracking, tool check-out / check-in, and physical-count variance audits.
--
-- Run this in the Supabase SQL editor on staging first, then prod.

------------------------------------------------------------------------
-- 1. Extend spare_parts so it can also hold consumables, tools, PPE, etc.
------------------------------------------------------------------------

alter table public.spare_parts
  add column if not exists item_type text not null default 'Consumable',
  add column if not exists production_use boolean not null default true;

-- `category` already exists as free text. Keep the column but constrain
-- expected values app-side; we don't want an enum here because admins may
-- want to add new categories without a migration.

-- Tools track who has them currently (a denormalised pointer that always
-- mirrors the most-recent open issue row for fast list rendering).
alter table public.spare_parts
  add column if not exists current_holder_user_id text default '',
  add column if not exists current_holder_name text default '',
  add column if not exists current_status text not null default 'In Stock';
  -- current_status: 'In Stock' | 'Out' (tools only — consumables stay 'In Stock')

-- Loosen machine_id: machine spares need it, consumables/tools/ppe don't.
alter table public.spare_parts
  alter column machine_id drop not null;

------------------------------------------------------------------------
-- 2. stock_issues: every draw-down (consumable) or tool check-out
------------------------------------------------------------------------

create table if not exists public.stock_issues (
  id text primary key,
  item_id text not null references public.spare_parts(id) on delete restrict,
  item_name text not null,
  item_type text not null default 'Consumable',
  category text default '',
  quantity numeric(14, 4) not null,
  unit_of_measure text not null default 'units',
  issued_at timestamptz not null default now(),
  issued_to_user_id text default '',
  issued_to_name text default '',
  issued_by_user_id text default '',
  issued_by_name text default '',
  job_id text default '',
  job_number text default '',
  notes text default '',
  -- Tool-only fields:
  status text not null default 'Issued', -- 'Issued' | 'Returned'
  returned_at timestamptz,
  condition_on_return text default '', -- 'Good' | 'Damaged' | 'Lost' | ''
  returned_by_user_id text default '',
  returned_by_name text default '',
  created_at timestamptz not null default now()
);

create index if not exists stock_issues_item_id_idx on public.stock_issues(item_id);
create index if not exists stock_issues_job_id_idx on public.stock_issues(job_id);
create index if not exists stock_issues_status_idx on public.stock_issues(status);
create index if not exists stock_issues_issued_at_idx on public.stock_issues(issued_at);

alter table public.stock_issues enable row level security;

drop policy if exists stock_issues_select on public.stock_issues;
create policy stock_issues_select on public.stock_issues
  for select to authenticated using (true);

drop policy if exists stock_issues_insert on public.stock_issues;
create policy stock_issues_insert on public.stock_issues
  for insert to authenticated with check (true);

drop policy if exists stock_issues_update on public.stock_issues;
create policy stock_issues_update on public.stock_issues
  for update to authenticated using (true) with check (true);
  -- Updates are mostly used for marking a tool returned; the app gates
  -- access via role checks.

drop policy if exists stock_issues_delete on public.stock_issues;
create policy stock_issues_delete on public.stock_issues
  for delete to authenticated using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

------------------------------------------------------------------------
-- 3. stock_counts + stock_count_lines: physical count sessions for variance
------------------------------------------------------------------------

create table if not exists public.stock_counts (
  id text primary key,
  counted_at timestamptz not null default now(),
  counted_by_user_id text default '',
  counted_by_name text default '',
  scope text default '',                  -- e.g. "Floor consumables", "All tools"
  notes text default '',
  reconciled boolean not null default false,
  reconciled_at timestamptz,
  reconciled_by_user_id text default '',
  reconciled_by_name text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.stock_count_lines (
  id text primary key,
  count_id text not null references public.stock_counts(id) on delete cascade,
  item_id text not null references public.spare_parts(id) on delete restrict,
  item_name text not null,
  system_qty numeric(14, 4) not null default 0,
  counted_qty numeric(14, 4) not null default 0,
  variance numeric(14, 4) not null default 0,
  notes text default '',
  created_at timestamptz not null default now()
);

create index if not exists stock_count_lines_count_id_idx on public.stock_count_lines(count_id);
create index if not exists stock_count_lines_item_id_idx on public.stock_count_lines(item_id);

alter table public.stock_counts enable row level security;
alter table public.stock_count_lines enable row level security;

drop policy if exists stock_counts_select on public.stock_counts;
create policy stock_counts_select on public.stock_counts
  for select to authenticated using (true);

drop policy if exists stock_counts_insert on public.stock_counts;
create policy stock_counts_insert on public.stock_counts
  for insert to authenticated with check (true);

drop policy if exists stock_counts_update on public.stock_counts;
create policy stock_counts_update on public.stock_counts
  for update to authenticated using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists stock_counts_delete on public.stock_counts;
create policy stock_counts_delete on public.stock_counts
  for delete to authenticated using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists stock_count_lines_select on public.stock_count_lines;
create policy stock_count_lines_select on public.stock_count_lines
  for select to authenticated using (true);

drop policy if exists stock_count_lines_insert on public.stock_count_lines;
create policy stock_count_lines_insert on public.stock_count_lines
  for insert to authenticated with check (true);

drop policy if exists stock_count_lines_update on public.stock_count_lines;
create policy stock_count_lines_update on public.stock_count_lines
  for update to authenticated using (true) with check (true);

drop policy if exists stock_count_lines_delete on public.stock_count_lines;
create policy stock_count_lines_delete on public.stock_count_lines
  for delete to authenticated using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

------------------------------------------------------------------------
-- 4. Sanity: backfill new spare_parts columns for existing rows.
------------------------------------------------------------------------
update public.spare_parts
  set item_type = coalesce(item_type, 'Consumable'),
      production_use = coalesce(production_use, true),
      current_status = coalesce(current_status, 'In Stock')
  where item_type is null
     or production_use is null
     or current_status is null;
