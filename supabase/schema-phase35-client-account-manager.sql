-- Phase 35 — Client account manager (sales ownership) + rep handover
--
--   * clients.account_manager_name — the staff member who owns/manages this
--     client. Drives the rep-handover tool on the Permissions page (reassign a
--     leaving rep's clients + open leads + open jobs to someone else).
--
-- Leads (assigned_to) and jobs (sales_owner_name) already carry an owner, so no
-- new columns are needed there.
--
-- Idempotent — safe to re-run.

alter table public.clients add column if not exists account_manager_name text not null default '';

notify pgrst, 'reload schema';
