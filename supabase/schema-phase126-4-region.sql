-- Phase 126.4 — Add supplier dispatch region to paper rates.
--
-- Sappi (and probably other big mills) prices by warehouse, with the
-- same product at DBN/JHB/CT having different per-ton costs. JomoPak
-- buys from whichever has stock, so each (paper × region) gets its
-- own rate row. Calculator picks the cheapest matching when multiple
-- are available.

alter table public.paper_rates
  add column if not exists region text;

comment on column public.paper_rates.region is
  'Supplier dispatch region (DBN / JHB / CT / Other). Private — admin only.';

-- Back-fill existing Sappi PrimePak U rows as JHB (assumed). Aman can
-- correct in the admin form if they actually ship from elsewhere.
update public.paper_rates
   set region = 'JHB'
 where supplier_id = 'sup-sappi'
   and product_code = 'PrimePak U'
   and region is null;
