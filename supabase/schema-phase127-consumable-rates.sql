-- Phase 127.1 — Consumable Rates (Glue / Tape / Ink / Stitching wire / etc.)
--
-- Rationale (Aman, 2026-06-04):
--   "If I have paper as my raw material, where does glue go and what
--    about tape and consumables?"
--
-- Parallel structure to paper_rates: same admin-only cost/charge split,
-- supplier-confidential, public-label-for-staff pattern. Lets us
-- itemise + cost-control consumables that previously were lumped into
-- cost_profiles as per-bag rates. cost_profiles stays unchanged for
-- cheap consumables you don't want to itemise.

create table if not exists public.consumable_rates (
  id              text primary key,
  name            text not null,
  supplier_id     text references public.suppliers(id) on delete set null,
  supplier_name   text,
  product_code    text,
  category        text not null default 'Other',
  unit            text not null default 'unit',
  public_label    text,
  cost_per_unit   numeric not null default 0,
  charge_per_unit numeric,
  region          text,
  valid_from      date,
  valid_to        date,
  notes           text,
  active          boolean not null default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists consumable_rates_category_idx on public.consumable_rates (category);
create index if not exists consumable_rates_active_idx on public.consumable_rates (active);

comment on table public.consumable_rates is
  'Phase 127.1 — Cost/charge masters for non-paper inputs (glue, tape, ink, etc.). Same admin-only confidentiality rules as paper_rates.';

comment on column public.consumable_rates.cost_per_unit is
  'COST per unit — what we pay the supplier. Private.';
comment on column public.consumable_rates.charge_per_unit is
  'CHARGE per unit — what the calculator uses. Private. Falls back to cost_per_unit if null.';
comment on column public.consumable_rates.public_label is
  'The ONLY label shown to non-admin staff (e.g. "Hot Melt Glue", "Brown PVC Tape 48mm").';
comment on column public.consumable_rates.category is
  'Glue / Tape / Stitching Wire / Ink / Solvent / Other.';
comment on column public.consumable_rates.unit is
  'kg / L / roll / case / bag / drum / pail / unit.';

-- Enable RLS in line with the rest of the project. Admin-only writes;
-- non-admin reads happen through a server-side function elsewhere so
-- they only see public_label not the prices.
alter table public.consumable_rates enable row level security;

drop policy if exists consumable_rates_admin_all on public.consumable_rates;
create policy consumable_rates_admin_all
  on public.consumable_rates
  for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Read-only access for non-admin authenticated users (drives the
-- calculator picker). The non-admin client only ever reads
-- (id, public_label, category, unit) via the application layer; the
-- price columns are dropped by the React layer before render.
drop policy if exists consumable_rates_read_all on public.consumable_rates;
create policy consumable_rates_read_all
  on public.consumable_rates
  for select
  using (auth.role() = 'authenticated');
