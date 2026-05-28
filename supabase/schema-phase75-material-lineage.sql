-- Phase 75: material lineage + slitting transformation.
--
-- Paper Log is being retired as a separate journal. Production Log
-- becomes the single source of truth for material consumption AND
-- transformation. When a Slitting log entry is saved on the client,
-- N new MaterialReceipt rows are auto-created (codes = parent +
-- suffix -A, -B, -C ...) inheriting paper grade + food-safe + FSC
-- + supplier batch from the parent. Parent quantity drops by what
-- was consumed.
--
-- These columns store the lineage so the food-safe walk on FG Stock
-- (computeFgFoodSafe) and any future audit / recall pipeline can
-- trace a finished good back to its specific paper roll, whether
-- that roll was received from a supplier or born from a slit.
--
-- The legacy paper_logs table is intentionally NOT dropped — Phase 76
-- will migrate existing rows into production_logs entries and then
-- the table can be retired.
--
-- Idempotent: safe to run more than once.

alter table public.material_receipts
  add column if not exists parent_material_receipt_id text,
  add column if not exists produced_by_production_log_id text;

-- Helpful indexes for the lineage walk.
create index if not exists material_receipts_parent_idx
  on public.material_receipts (parent_material_receipt_id)
  where parent_material_receipt_id is not null;

create index if not exists material_receipts_produced_by_idx
  on public.material_receipts (produced_by_production_log_id)
  where produced_by_production_log_id is not null;
