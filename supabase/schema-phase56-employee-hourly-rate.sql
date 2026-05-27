-- Phase 56 — Employee hourly rate + standard monthly hours
-- Required by SMETA wage-and-benefit audits so the payslip can show
-- a defensible "Rates & Quantities" table (hours × rate × premium).
-- Idempotent. Safe to re-run.

alter table public.employees add column if not exists hourly_rate              numeric;
alter table public.employees add column if not exists standard_monthly_hours   numeric;

notify pgrst, 'reload schema';
