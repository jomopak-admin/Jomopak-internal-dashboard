-- Phase 126.1 — Paper Rate redesign: cost/charge split + use case grouping
-- + public label + supplier confidentiality.
--
-- Rationale (Aman, 2026-06-03):
--   "I want a cost that I pay to Sappi, then a cost that I charge for paper.
--    Only for my eyes and admin/necessary people. Profit from paper as a
--    separate analytic. Staff must not see suppliers — only the public
--    label like '70gsm Virgin Kraft'."
--
-- This migration is additive — it does NOT touch existing rows or the
-- legacy price_per_ton column (which now stores the supplier cost). The
-- new charge_per_ton is what the calculator actually uses. If null,
-- the calculator falls back to price_per_ton so legacy data still works.

alter table public.paper_rates
  add column if not exists product_code text,
  add column if not exists use_case text,
  add column if not exists form text,
  add column if not exists public_label text,
  add column if not exists charge_per_ton numeric,
  add column if not exists valid_from date,
  add column if not exists valid_to date;

-- Index for the calculator picker's group-by-use-case query.
create index if not exists paper_rates_use_case_idx on public.paper_rates (use_case);

comment on column public.paper_rates.product_code is
  'Supplier product code, e.g. "PrimePak U". Private — admin/pricingEditor only.';
comment on column public.paper_rates.use_case is
  'What we buy this paper for: Paper Bags, Slitting, Rope, Handle Patch, Greaseproof Paper, Other.';
comment on column public.paper_rates.form is
  'Reels or Sheets.';
comment on column public.paper_rates.public_label is
  'The ONLY label shown to non-admin staff in the calculator (e.g. "70gsm Unbleached Kraft").';
comment on column public.paper_rates.price_per_ton is
  'COST per ton — what we pay the supplier. Private.';
comment on column public.paper_rates.charge_per_ton is
  'CHARGE per ton — what the calculator uses for quotes. Private. Admin sets above price_per_ton to absorb fuel / forex / supplier hikes.';
