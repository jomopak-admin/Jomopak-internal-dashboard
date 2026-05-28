-- Phase 85: bag spec + sale units live on the Product itself.
--
-- DRY: the bag's dimensions and handle were duplicated between the
-- product's defaults and its pricingSpec. The pricing section ALSO
-- redundantly asked for paper / dimensions / handle every time. We've
-- pulled bag spec onto the Product directly so jobs, quotes, finished
-- stock, the pricing engine, and the (future) materials-driven cost
-- pipeline all read from one place.
--
-- Sale units are how the customer can purchase the product — Pallet,
-- Box, Bale, Case, Single — each with the bag count it contains. So
-- "1 pallet" on a quote is unambiguous downstream.
--
-- Idempotent: safe to run more than once.

alter table public.products
  add column if not exists bag_width_mm text default '',
  add column if not exists bag_height_mm text default '',
  add column if not exists gusset_mm text default '',
  add column if not exists handle_type text default 'None',
  add column if not exists sales_units jsonb default '[]'::jsonb;
