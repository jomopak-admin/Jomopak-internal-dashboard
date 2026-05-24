-- Phase 31 — Multi-currency / FX
--
--   * app_settings.currency_config — jsonb: base currency + editable rate table.
--   * invoices.exchange_rate / supplier_bills.exchange_rate — booking rate to
--     base (ZAR) at document date. Defaults to 1.
--   * seeds chart account 4920 Foreign Exchange Gain / (Loss).
--
-- Idempotent — safe to re-run.

alter table public.app_settings add column if not exists currency_config jsonb
  not null default '{"baseCurrency":"ZAR","rates":[{"code":"USD","rateToBase":18.5,"asOf":""},{"code":"EUR","rateToBase":20.0,"asOf":""},{"code":"GBP","rateToBase":23.5,"asOf":""}]}'::jsonb;

alter table public.invoices add column if not exists exchange_rate numeric(16, 6) not null default 1;
alter table public.supplier_bills add column if not exists exchange_rate numeric(16, 6) not null default 1;

insert into public.ledger_accounts (id, code, name, type, sub_type, vat_applicable, active, notes) values
  ('acct-4920', '4920', 'Foreign Exchange Gain / (Loss)', 'Income', 'Revenue', false, true, '')
on conflict (id) do nothing;

notify pgrst, 'reload schema';
