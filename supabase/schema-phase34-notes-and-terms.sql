-- Phase 34 — Customer notes + global Terms & Conditions on documents
--
--   * A per-document customer-facing note on invoices, quotes and delivery
--     notes (pre-filled from a Settings default, editable per document).
--   * One global Terms & Conditions block + a default customer note, stored on
--     app_settings and printed on every customer-facing document.
--
-- Idempotent — safe to re-run.

alter table public.invoices         add column if not exists customer_note text not null default '';
alter table public.quote_estimates  add column if not exists customer_note text not null default '';
alter table public.delivery_notes   add column if not exists customer_note text not null default '';

alter table public.app_settings     add column if not exists default_customer_note text not null default '';
alter table public.app_settings     add column if not exists terms_and_conditions  text not null default '';

notify pgrst, 'reload schema';
