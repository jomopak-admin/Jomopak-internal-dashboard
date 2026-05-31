-- ─────────────────────────────────────────────────────────────────────────
-- Phase 118.1 — Calculator quote snapshot on quote_estimates.
--
-- Adds two columns so a multi-line Calculator quote can be re-printed
-- exactly as it was originally sent, even months later:
--
--   - calculator_batch_id  → groups every row that came from one Save
--                            click in the calculator (-A / -B / -C…)
--   - calculator_snapshot  → jsonb copy of THIS row's CalculatorState
--                            (shared header + just this line). Keeping
--                            it per-row makes deletes safe — drop one
--                            row, the rest still re-stitch cleanly.
--
-- Both nullable + default null so legacy quotes load unchanged.
-- ─────────────────────────────────────────────────────────────────────────

alter table if exists public.quote_estimates
  add column if not exists calculator_batch_id text,
  add column if not exists calculator_snapshot jsonb;

comment on column public.quote_estimates.calculator_batch_id is
  'Phase 118.1 — groups sibling rows from one Calculator save. Null for old-form quotes.';
comment on column public.quote_estimates.calculator_snapshot is
  'Phase 118.1 — frozen CalculatorState (shared + this row''s line). Used by Quotes → Print to re-render via CalculatorQuotePrint.';

-- Partial index — only the calculator-sourced quotes participate, so the
-- index stays small (~0 bytes for a fresh DB, only grows with calculator usage).
create index if not exists quote_estimates_calc_batch_idx
  on public.quote_estimates(calculator_batch_id)
  where calculator_batch_id is not null;
