-- Phase 37 — Reception kiosk fields on visitor_log_entries
--
-- Captures the extra info collected at the front-desk kiosk:
--   * phone_number          — contact in case of emergency
--   * vehicle_registration  — for delivery drivers / site security
--   * signature_data_url    — on-screen signature on the hygiene ack and/or sign-out
--   * kiosk_checkin/out     — flags marking entries created via the self-serve kiosk
--
-- Idempotent — safe to re-run.

alter table public.visitor_log_entries add column if not exists phone_number          text;
alter table public.visitor_log_entries add column if not exists vehicle_registration  text;
alter table public.visitor_log_entries add column if not exists signature_data_url    text;
alter table public.visitor_log_entries add column if not exists kiosk_checkin         boolean not null default false;
alter table public.visitor_log_entries add column if not exists kiosk_checkout        boolean not null default false;

-- Phase 38 — reception verification of kiosk check-ins.
alter table public.visitor_log_entries add column if not exists staff_verified        boolean not null default false;
alter table public.visitor_log_entries add column if not exists verified_by_name      text;
alter table public.visitor_log_entries add column if not exists verified_at           timestamptz;

notify pgrst, 'reload schema';
