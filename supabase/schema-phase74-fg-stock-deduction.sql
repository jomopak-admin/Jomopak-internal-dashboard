-- Phase 74: source FG batch links on Delivery Notes and Invoices.
--
-- When a Delivery Note or Invoice is created from a finished goods batch
-- (Phase 73 "+ DN" / "+ Invoice" buttons on the FG Stock page), the source
-- batch is recorded here. On first save, the client deducts the line
-- quantities from finished_goods_stock.quantity_available and writes an
-- audit row to stock_change_logs.
--
-- These columns are FK soft-links (no constraint) — the batch may be
-- deleted later without losing the historical pointer.
--
-- Idempotent: safe to run more than once.

alter table public.delivery_notes
  add column if not exists source_finished_goods_stock_id text;

alter table public.invoices
  add column if not exists source_finished_goods_stock_id text;
