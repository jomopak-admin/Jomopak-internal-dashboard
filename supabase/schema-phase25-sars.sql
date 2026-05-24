-- Phase 25 — SARS Centre (tax organizer / prep)
--
--   * sars_filings — one row per SARS return period (VAT201, EMP201, EMP501,
--                    IRP6, ITR14) with figures, status, and a submission/payment
--                    trail. Deadlines themselves are generated client-side from
--                    config; only periods the user opens get a saved row.
--   * app_settings.sars_config — jsonb holding VAT category/frequency, payroll
--                    flag and financial year-end that drive the deadline calendar.
--
-- This is an ORGANIZER, not a tax engine. No tax is computed server-side.
-- Idempotent — safe to re-run.

-- ── SARS filings ────────────────────────────────────────────────────────────
create table if not exists public.sars_filings (
  id text primary key,
  obligation_type text not null default 'VAT201',  -- VAT201 | EMP201 | EMP501 | IRP6 | ITR14
  period_key text not null default '',
  period_label text not null default '',
  period_start text not null default '',
  period_end text not null default '',
  due_date text not null default '',
  status text not null default 'Not Started',       -- Not Started | In Progress | Submitted | Paid
  output_vat numeric(16, 2) not null default 0,
  input_vat numeric(16, 2) not null default 0,
  manual_adjustment numeric(16, 2) not null default 0,
  net_vat_payable numeric(16, 2) not null default 0,
  amount_payable numeric(16, 2) not null default 0,
  figures jsonb not null default '[]'::jsonb,
  submitted_date text not null default '',
  submitted_by text not null default '',
  payment_date text not null default '',
  payment_reference text not null default '',
  proof_document_id text default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists sars_filings_obligation_idx on public.sars_filings(obligation_type);
create index if not exists sars_filings_due_idx on public.sars_filings(due_date);
create unique index if not exists sars_filings_period_key_idx on public.sars_filings(period_key);

alter table public.sars_filings enable row level security;

drop policy if exists sars_filings_select on public.sars_filings;
create policy sars_filings_select on public.sars_filings for select to authenticated using (true);
drop policy if exists sars_filings_insert on public.sars_filings;
create policy sars_filings_insert on public.sars_filings for insert to authenticated with check (true);
drop policy if exists sars_filings_update on public.sars_filings;
create policy sars_filings_update on public.sars_filings for update to authenticated using (true) with check (true);
drop policy if exists sars_filings_delete on public.sars_filings;
create policy sars_filings_delete on public.sars_filings for delete to authenticated using (true);

-- ── SARS config on app_settings ─────────────────────────────────────────────
alter table public.app_settings add column if not exists sars_config jsonb
  not null default '{"vatRegistered":true,"vatCategory":"A","vatFrequency":"bimonthly","payrollActive":true,"financialYearEndMonth":2}'::jsonb;

notify pgrst, 'reload schema';
