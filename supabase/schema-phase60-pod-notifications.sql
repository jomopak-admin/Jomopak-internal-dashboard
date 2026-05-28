-- Phase 60 — Driver POD notifications + Driver role
-- Adds an opt-out column to clients so they can suppress automatic
-- delivery-confirmation emails. Idempotent. Safe to re-run.

alter table public.clients
  add column if not exists notify_client_on_delivery boolean default true;

-- Backfill: legacy clients should default to opted-in so existing
-- customers start receiving delivery confirmations the next time
-- a POD is captured against their account.
update public.clients
  set notify_client_on_delivery = true
  where notify_client_on_delivery is null;

notify pgrst, 'reload schema';
