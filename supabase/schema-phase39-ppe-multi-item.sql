-- Phase 39 — PPE multi-item issue + employee signature
--
--   * items                       — jsonb array of {type, description, quantity}
--                                   so a single issue can cover everything
--                                   handed to a staff member at the same time.
--   * employee_signature_data_url — PNG data URL of the on-screen signature
--                                   acknowledging receipt of all items above.
--
-- Idempotent — safe to re-run. Legacy single-item columns (item_type,
-- item_description, quantity) remain populated from the first item.

alter table public.ppe_issue_records add column if not exists items                       jsonb;
alter table public.ppe_issue_records add column if not exists employee_signature_data_url text;

notify pgrst, 'reload schema';
