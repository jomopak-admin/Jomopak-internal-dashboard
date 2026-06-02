-- Phase 119 — Customer payment model on Client record.
--
-- JomoPak runs four distinct AR flows depending on the customer:
--   depositThenDraw, fiftyFifty, prepayThenDraw, cod, standard.
--
-- The model lives on the Client record so sales doesn't have to remember
-- which customer needs which treatment; new Pro-formas / Quotes / Jobs
-- for that client pre-fill the right flow.
--
-- The full Customer Deposit Ledger (customer_deposits table + allocation
-- tracking) is the larger Phase 119 follow-up — not in this migration.
-- This file is just the per-client classification so the form data we're
-- already capturing in the dashboard actually survives a page refresh.
--
-- Idempotent: safe to run more than once.

alter table public.clients
  add column if not exists payment_model text,
  add column if not exists default_deposit_percent numeric;

comment on column public.clients.payment_model is
  'Phase 119. AR payment flow for this customer. One of: '
  'depositThenDraw, fiftyFifty, prepayThenDraw, cod, standard.';

comment on column public.clients.default_deposit_percent is
  'Phase 119. Default deposit % expected from this customer (e.g. 50 '
  'for 50/50, 100 for full prepay). Used to pre-fill new pro-formas.';
