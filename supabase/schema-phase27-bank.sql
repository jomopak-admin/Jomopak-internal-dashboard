-- Phase 27 — Bank reconciliation
--
--   * bank_transactions — lines imported from a bank statement CSV, each
--     optionally matched to an invoice / supplier bill / payroll run / ledger
--     account, with a reconciled flag.
--
-- Records matches; does not auto-post payments. Idempotent — safe to re-run.

create table if not exists public.bank_transactions (
  id text primary key,
  import_batch text not null default '',
  bank_account_name text not null default '',
  date text not null default '',
  description text not null default '',
  reference text not null default '',
  amount numeric(16, 2) not null default 0,        -- + money in, - money out
  match_type text not null default 'none',         -- none | invoice | bill | payroll | account
  match_id text not null default '',
  match_label text not null default '',
  ledger_account_id text default '',
  reconciled boolean not null default false,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists bank_transactions_date_idx on public.bank_transactions(date);
create index if not exists bank_transactions_reconciled_idx on public.bank_transactions(reconciled);
create index if not exists bank_transactions_batch_idx on public.bank_transactions(import_batch);

alter table public.bank_transactions enable row level security;

drop policy if exists bank_transactions_select on public.bank_transactions;
create policy bank_transactions_select on public.bank_transactions for select to authenticated using (true);
drop policy if exists bank_transactions_insert on public.bank_transactions;
create policy bank_transactions_insert on public.bank_transactions for insert to authenticated with check (true);
drop policy if exists bank_transactions_update on public.bank_transactions;
create policy bank_transactions_update on public.bank_transactions for update to authenticated using (true) with check (true);
drop policy if exists bank_transactions_delete on public.bank_transactions;
create policy bank_transactions_delete on public.bank_transactions for delete to authenticated using (true);

notify pgrst, 'reload schema';
