-- Phase 64 — Photos on Chemical Register + Material Receipts
-- Brings them in line with spare_parts, finished_goods_stock, products,
-- jobs, employees (Phase 59) so the stock-take printable sheet can
-- show a thumbnail next to every item.
-- Idempotent. Safe to re-run.

alter table public.chemical_register_entries
  add column if not exists photo_urls jsonb;

alter table public.material_receipts
  add column if not exists photo_urls jsonb;

notify pgrst, 'reload schema';
