-- Phase 122 — Link PPE records to Employee records.
--
-- Before this migration PPE was captured against a free-text staff_name
-- only. That made it impossible to:
--   - reverse-query "what PPE does this employee have outstanding?"
--   - show staff their own PPE on the My Stuff portal
--   - keep history clean across name changes / typos
--
-- This migration adds employee_id as a nullable text column so legacy
-- free-text rows still load. New rows captured via the Combobox in the
-- PPE form always carry employee_id; the staff_name + staff_role columns
-- continue to be populated as a frozen snapshot for printables.
--
-- Idempotent: safe to run more than once.

alter table public.ppe_issue_records
  add column if not exists employee_id text;

create index if not exists ppe_issue_records_employee_id_idx
  on public.ppe_issue_records (employee_id);

comment on column public.ppe_issue_records.employee_id is
  'Phase 122. Optional pointer to public.employees.id. Required on new '
  'rows captured via the Combobox; null on legacy free-text rows. Drives '
  'the Employee-profile PPE panel and the staff portal "PPE you have" card.';
