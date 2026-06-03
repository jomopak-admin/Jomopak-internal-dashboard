-- Phase 126.1 — Seed Sappi PrimePak Unbleached paper rates.
--
-- Source: Sappi Paper & Paper Packaging price letter
-- Contract period: 1 April 2025 – 30 September 2025
-- Use case: Slitting (we slit jumbo reels into the widths we need)
-- Form: Reels
--
-- Charge per ton is set 3% above cost as a default buffer for fuel /
-- price hikes between contract renewals. Aman can adjust each row per
-- client in the calculator on top of this.

-- First, make sure Sappi exists as a supplier. Upsert by name so we
-- get a stable id even if the row is already there.
insert into public.suppliers (id, name, contact_person, phone, email, active, notes)
values (
  'sup-sappi',
  'Sappi Paper & Paper Packaging',
  '',
  '',
  '',
  true,
  'Phase 126.1 seed.'
)
on conflict (id) do update set
  name = excluded.name,
  active = true;

-- Now the 6 paper rates. 90 & 100 gsm are split into two rows since they
-- share a price in Sappi's letter but are different specs in our calc.
insert into public.paper_rates (
  id, name, supplier_id, supplier_name, product_code, use_case, form,
  public_label, paper_type, gsm,
  price_per_ton, charge_per_ton,
  valid_from, valid_to,
  notes, active
) values
  ('paper-sappi-ppu-50', 'Sappi PrimePak U 50gsm', 'sup-sappi', 'Sappi Paper & Paper Packaging', 'PrimePak U', 'Slitting', 'Reels',
   '50gsm Unbleached Kraft', 'Unbleached Kraft', '50',
   18594, 19150,
   '2025-04-01', '2025-09-30',
   'Sappi PrimePak Unbleached contract.', true),
  ('paper-sappi-ppu-60', 'Sappi PrimePak U 60gsm', 'sup-sappi', 'Sappi Paper & Paper Packaging', 'PrimePak U', 'Slitting', 'Reels',
   '60gsm Unbleached Kraft', 'Unbleached Kraft', '60',
   18037, 18580,
   '2025-04-01', '2025-09-30',
   'Sappi PrimePak Unbleached contract.', true),
  ('paper-sappi-ppu-70', 'Sappi PrimePak U 70gsm', 'sup-sappi', 'Sappi Paper & Paper Packaging', 'PrimePak U', 'Slitting', 'Reels',
   '70gsm Unbleached Kraft', 'Unbleached Kraft', '70',
   17479, 18000,
   '2025-04-01', '2025-09-30',
   'Sappi PrimePak Unbleached contract. Default charge per Aman example.', true),
  ('paper-sappi-ppu-80', 'Sappi PrimePak U 80gsm', 'sup-sappi', 'Sappi Paper & Paper Packaging', 'PrimePak U', 'Slitting', 'Reels',
   '80gsm Unbleached Kraft', 'Unbleached Kraft', '80',
   16934, 17440,
   '2025-04-01', '2025-09-30',
   'Sappi PrimePak Unbleached contract.', true),
  ('paper-sappi-ppu-90', 'Sappi PrimePak U 90gsm', 'sup-sappi', 'Sappi Paper & Paper Packaging', 'PrimePak U', 'Slitting', 'Reels',
   '90gsm Unbleached Kraft', 'Unbleached Kraft', '90',
   16363, 16850,
   '2025-04-01', '2025-09-30',
   'Sappi PrimePak Unbleached contract. Same price as 100gsm per Sappi letter.', true),
  ('paper-sappi-ppu-100', 'Sappi PrimePak U 100gsm', 'sup-sappi', 'Sappi Paper & Paper Packaging', 'PrimePak U', 'Slitting', 'Reels',
   '100gsm Unbleached Kraft', 'Unbleached Kraft', '100',
   16363, 16850,
   '2025-04-01', '2025-09-30',
   'Sappi PrimePak Unbleached contract. Same price as 90gsm per Sappi letter.', true)
on conflict (id) do update set
  supplier_id = excluded.supplier_id,
  supplier_name = excluded.supplier_name,
  product_code = excluded.product_code,
  use_case = excluded.use_case,
  form = excluded.form,
  public_label = excluded.public_label,
  paper_type = excluded.paper_type,
  gsm = excluded.gsm,
  price_per_ton = excluded.price_per_ton,
  charge_per_ton = excluded.charge_per_ton,
  valid_from = excluded.valid_from,
  valid_to = excluded.valid_to,
  notes = excluded.notes,
  active = excluded.active;
