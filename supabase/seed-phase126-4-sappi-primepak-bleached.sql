-- Phase 126.4 — Seed Sappi PrimePak Bleached paper rates.
--
-- Source: Sappi Paper & Paper Packaging extended 2025 pricing letter
-- Contract period: 1 October 2025 – 31 March 2026
-- Regions: DBN (Durban) / JHB (Joburg) / CT (Cape Town)
-- Use cases: Paper Bags + Handle Patches (bleached kraft, food-grade)
-- Form: Reels  •  requires_slitting = true
--
-- 5 grammages × 3 regions = 15 rows. The "75 - 100gsm" bracket in the
-- Sappi letter shares one price across 75/80/90/100, so we split it
-- into 4 rows at the same per-ton price.
--
-- Charge per ton ≈ 2% above cost (Aman's fuel/forex buffer). Adjust
-- per row in the admin form once these land.

insert into public.paper_rates (
  id, name, supplier_id, supplier_name, product_code,
  use_cases, use_case, requires_slitting,
  form, region,
  public_label, paper_type, gsm,
  price_per_ton, charge_per_ton,
  valid_from, valid_to,
  notes, active
) values
  -- 50gsm × 3 regions
  ('paper-sappi-ppb-50-dbn', 'Sappi PrimePak Bleached 50gsm DBN', 'sup-sappi', 'Sappi Paper & Paper Packaging', 'PrimePak Bleached',
   array['Paper Bags', 'Handle Patches']::text[], 'Paper Bags', true,
   'Reels', 'DBN',
   '50gsm Bleached Kraft', 'Bleached Kraft', '50',
   30388, 31000, '2025-10-01', '2026-03-31',
   'Sappi PrimePak Bleached extended 2025 contract.', true),
  ('paper-sappi-ppb-50-jhb', 'Sappi PrimePak Bleached 50gsm JHB', 'sup-sappi', 'Sappi Paper & Paper Packaging', 'PrimePak Bleached',
   array['Paper Bags', 'Handle Patches']::text[], 'Paper Bags', true,
   'Reels', 'JHB',
   '50gsm Bleached Kraft', 'Bleached Kraft', '50',
   30688, 31300, '2025-10-01', '2026-03-31',
   'Sappi PrimePak Bleached extended 2025 contract.', true),
  ('paper-sappi-ppb-50-ct',  'Sappi PrimePak Bleached 50gsm CT',  'sup-sappi', 'Sappi Paper & Paper Packaging', 'PrimePak Bleached',
   array['Paper Bags', 'Handle Patches']::text[], 'Paper Bags', true,
   'Reels', 'CT',
   '50gsm Bleached Kraft', 'Bleached Kraft', '50',
   31338, 31970, '2025-10-01', '2026-03-31',
   'Sappi PrimePak Bleached extended 2025 contract.', true),

  -- 75gsm × 3 regions
  ('paper-sappi-ppb-75-dbn', 'Sappi PrimePak Bleached 75gsm DBN', 'sup-sappi', 'Sappi Paper & Paper Packaging', 'PrimePak Bleached',
   array['Paper Bags', 'Handle Patches']::text[], 'Paper Bags', true,
   'Reels', 'DBN',
   '75gsm Bleached Kraft', 'Bleached Kraft', '75',
   26694, 27230, '2025-10-01', '2026-03-31',
   'Sappi PrimePak Bleached extended 2025 contract. 75-100gsm same per-ton price.', true),
  ('paper-sappi-ppb-75-jhb', 'Sappi PrimePak Bleached 75gsm JHB', 'sup-sappi', 'Sappi Paper & Paper Packaging', 'PrimePak Bleached',
   array['Paper Bags', 'Handle Patches']::text[], 'Paper Bags', true,
   'Reels', 'JHB',
   '75gsm Bleached Kraft', 'Bleached Kraft', '75',
   26994, 27530, '2025-10-01', '2026-03-31',
   'Sappi PrimePak Bleached extended 2025 contract. 75-100gsm same per-ton price.', true),
  ('paper-sappi-ppb-75-ct',  'Sappi PrimePak Bleached 75gsm CT',  'sup-sappi', 'Sappi Paper & Paper Packaging', 'PrimePak Bleached',
   array['Paper Bags', 'Handle Patches']::text[], 'Paper Bags', true,
   'Reels', 'CT',
   '75gsm Bleached Kraft', 'Bleached Kraft', '75',
   27644, 28200, '2025-10-01', '2026-03-31',
   'Sappi PrimePak Bleached extended 2025 contract. 75-100gsm same per-ton price.', true),

  -- 80gsm × 3 regions
  ('paper-sappi-ppb-80-dbn', 'Sappi PrimePak Bleached 80gsm DBN', 'sup-sappi', 'Sappi Paper & Paper Packaging', 'PrimePak Bleached',
   array['Paper Bags', 'Handle Patches']::text[], 'Paper Bags', true,
   'Reels', 'DBN',
   '80gsm Bleached Kraft', 'Bleached Kraft', '80',
   26694, 27230, '2025-10-01', '2026-03-31',
   'Sappi PrimePak Bleached extended 2025 contract. 75-100gsm same per-ton price.', true),
  ('paper-sappi-ppb-80-jhb', 'Sappi PrimePak Bleached 80gsm JHB', 'sup-sappi', 'Sappi Paper & Paper Packaging', 'PrimePak Bleached',
   array['Paper Bags', 'Handle Patches']::text[], 'Paper Bags', true,
   'Reels', 'JHB',
   '80gsm Bleached Kraft', 'Bleached Kraft', '80',
   26994, 27530, '2025-10-01', '2026-03-31',
   'Sappi PrimePak Bleached extended 2025 contract. 75-100gsm same per-ton price.', true),
  ('paper-sappi-ppb-80-ct',  'Sappi PrimePak Bleached 80gsm CT',  'sup-sappi', 'Sappi Paper & Paper Packaging', 'PrimePak Bleached',
   array['Paper Bags', 'Handle Patches']::text[], 'Paper Bags', true,
   'Reels', 'CT',
   '80gsm Bleached Kraft', 'Bleached Kraft', '80',
   27644, 28200, '2025-10-01', '2026-03-31',
   'Sappi PrimePak Bleached extended 2025 contract. 75-100gsm same per-ton price.', true),

  -- 90gsm × 3 regions
  ('paper-sappi-ppb-90-dbn', 'Sappi PrimePak Bleached 90gsm DBN', 'sup-sappi', 'Sappi Paper & Paper Packaging', 'PrimePak Bleached',
   array['Paper Bags', 'Handle Patches']::text[], 'Paper Bags', true,
   'Reels', 'DBN',
   '90gsm Bleached Kraft', 'Bleached Kraft', '90',
   26694, 27230, '2025-10-01', '2026-03-31',
   'Sappi PrimePak Bleached extended 2025 contract. 75-100gsm same per-ton price.', true),
  ('paper-sappi-ppb-90-jhb', 'Sappi PrimePak Bleached 90gsm JHB', 'sup-sappi', 'Sappi Paper & Paper Packaging', 'PrimePak Bleached',
   array['Paper Bags', 'Handle Patches']::text[], 'Paper Bags', true,
   'Reels', 'JHB',
   '90gsm Bleached Kraft', 'Bleached Kraft', '90',
   26994, 27530, '2025-10-01', '2026-03-31',
   'Sappi PrimePak Bleached extended 2025 contract. 75-100gsm same per-ton price.', true),
  ('paper-sappi-ppb-90-ct',  'Sappi PrimePak Bleached 90gsm CT',  'sup-sappi', 'Sappi Paper & Paper Packaging', 'PrimePak Bleached',
   array['Paper Bags', 'Handle Patches']::text[], 'Paper Bags', true,
   'Reels', 'CT',
   '90gsm Bleached Kraft', 'Bleached Kraft', '90',
   27644, 28200, '2025-10-01', '2026-03-31',
   'Sappi PrimePak Bleached extended 2025 contract. 75-100gsm same per-ton price.', true),

  -- 100gsm × 3 regions
  ('paper-sappi-ppb-100-dbn', 'Sappi PrimePak Bleached 100gsm DBN', 'sup-sappi', 'Sappi Paper & Paper Packaging', 'PrimePak Bleached',
   array['Paper Bags', 'Handle Patches']::text[], 'Paper Bags', true,
   'Reels', 'DBN',
   '100gsm Bleached Kraft', 'Bleached Kraft', '100',
   26694, 27230, '2025-10-01', '2026-03-31',
   'Sappi PrimePak Bleached extended 2025 contract. 75-100gsm same per-ton price.', true),
  ('paper-sappi-ppb-100-jhb', 'Sappi PrimePak Bleached 100gsm JHB', 'sup-sappi', 'Sappi Paper & Paper Packaging', 'PrimePak Bleached',
   array['Paper Bags', 'Handle Patches']::text[], 'Paper Bags', true,
   'Reels', 'JHB',
   '100gsm Bleached Kraft', 'Bleached Kraft', '100',
   26994, 27530, '2025-10-01', '2026-03-31',
   'Sappi PrimePak Bleached extended 2025 contract. 75-100gsm same per-ton price.', true),
  ('paper-sappi-ppb-100-ct',  'Sappi PrimePak Bleached 100gsm CT',  'sup-sappi', 'Sappi Paper & Paper Packaging', 'PrimePak Bleached',
   array['Paper Bags', 'Handle Patches']::text[], 'Paper Bags', true,
   'Reels', 'CT',
   '100gsm Bleached Kraft', 'Bleached Kraft', '100',
   27644, 28200, '2025-10-01', '2026-03-31',
   'Sappi PrimePak Bleached extended 2025 contract. 75-100gsm same per-ton price.', true)
on conflict (id) do update set
  supplier_id    = excluded.supplier_id,
  supplier_name  = excluded.supplier_name,
  product_code   = excluded.product_code,
  use_cases      = excluded.use_cases,
  use_case       = excluded.use_case,
  requires_slitting = excluded.requires_slitting,
  form           = excluded.form,
  region         = excluded.region,
  public_label   = excluded.public_label,
  paper_type     = excluded.paper_type,
  gsm            = excluded.gsm,
  price_per_ton  = excluded.price_per_ton,
  charge_per_ton = excluded.charge_per_ton,
  valid_from     = excluded.valid_from,
  valid_to       = excluded.valid_to,
  notes          = excluded.notes,
  active         = excluded.active;
