-- Phase 128.1 — Unified MATERIAL RATES.
--
-- Rationale (Aman, 2026-06-04):
--   "Whatever is my cost should be my cost, especially if we are
--    building to white label."
--
-- This collapses paper_rates + consumable_rates into ONE table: every
-- cost master is just a material with a category and a unit. Paper
-- keeps its own optional fields (gsm, form, use_cases). White-label
-- customers can add their own categories without code changes.
--
-- Strategy: NEW table material_rates. Copy existing rows from
-- paper_rates + consumable_rates. Old tables stay temporarily as
-- backup; drop in a later phase once we're confident.

create table if not exists public.material_rates (
  id              text primary key,
  name            text not null,
  public_label    text,
  category        text not null default 'Other',
  unit            text not null default 'unit',
  supplier_id     text references public.suppliers(id) on delete set null,
  supplier_name   text,
  product_code    text,
  region          text,
  cost_per_unit   numeric not null default 0,
  charge_per_unit numeric,
  valid_from      date,
  valid_to        date,
  notes           text,
  active          boolean not null default true,
  -- Paper-specific optional columns. Null for non-paper rows. White-label
  -- customers ignore them entirely.
  gsm             text,
  paper_type      text,
  form            text,
  use_cases       text[],
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists material_rates_category_idx on public.material_rates (category);
create index if not exists material_rates_active_idx on public.material_rates (active);

comment on table public.material_rates is
  'Phase 128.1 — Unified cost masters. Single source of truth for paper, glue, tape, ink, anything. Replaces paper_rates + consumable_rates.';

-- Enable RLS — admin-only writes, authenticated reads.
alter table public.material_rates enable row level security;

drop policy if exists material_rates_admin_all on public.material_rates;
create policy material_rates_admin_all
  on public.material_rates for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists material_rates_read_all on public.material_rates;
create policy material_rates_read_all
  on public.material_rates for select
  using (auth.role() = 'authenticated');

-- ── Data migration: copy from paper_rates ──
-- Paper rates become Material rates with category='Paper', unit='ton'.
insert into public.material_rates (
  id, name, public_label, category, unit,
  supplier_id, supplier_name, product_code, region,
  cost_per_unit, charge_per_unit,
  valid_from, valid_to,
  notes, active,
  gsm, paper_type, form, use_cases
)
select
  id,
  name,
  public_label,
  'Paper'::text,
  'ton'::text,
  supplier_id, supplier_name, product_code, region,
  price_per_ton,           -- legacy column is the cost
  charge_per_ton,
  valid_from, valid_to,
  notes, active,
  gsm, paper_type, form, use_cases
from public.paper_rates
on conflict (id) do nothing;

-- ── Data migration: copy from consumable_rates (if it exists) ──
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='consumable_rates') then
    insert into public.material_rates (
      id, name, public_label, category, unit,
      supplier_id, supplier_name, product_code, region,
      cost_per_unit, charge_per_unit,
      valid_from, valid_to,
      notes, active
    )
    select
      id, name, public_label, category, unit,
      supplier_id, supplier_name, product_code, region,
      cost_per_unit, charge_per_unit,
      valid_from, valid_to,
      notes, active
    from public.consumable_rates
    on conflict (id) do nothing;
  end if;
end $$;
