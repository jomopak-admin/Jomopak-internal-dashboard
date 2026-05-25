-- Phase 34 — Customer notes + global Terms & Conditions on documents
--
--   * A per-document customer-facing note on invoices, quotes and delivery
--     notes (pre-filled from a Settings default, editable per document).
--   * Settings-level defaults on app_settings: a default customer note, a short
--     "basic terms" blurb, and a one-line reference to the full T&Cs online.
--     Basic terms + reference print on quotes & invoices (not delivery notes).
--
-- Idempotent — safe to re-run.

alter table public.invoices         add column if not exists customer_note text not null default '';
alter table public.quote_estimates  add column if not exists customer_note text not null default '';
alter table public.delivery_notes   add column if not exists customer_note text not null default '';

alter table public.app_settings     add column if not exists default_customer_note text not null default '';
alter table public.app_settings     add column if not exists terms_and_conditions  text not null default '';
alter table public.app_settings     add column if not exists terms_reference_line  text not null default '';

notify pgrst, 'reload schema';
