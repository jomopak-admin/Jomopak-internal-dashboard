-- Phase 24 — Accounting core (Chart of Accounts + Accounts Payable)
--
-- Foundation for the bookkeeping / SARS-prep layer:
--   * ledger_accounts  — the chart of accounts (assets, liabilities, equity,
--                        income, expenses) every transaction classifies into.
--   * supplier_bills   — money owed to suppliers (creditors / accounts payable),
--                        with a payments array and a running outstanding balance.
--
-- Idempotent — safe to re-run.

-- ── Chart of Accounts ──────────────────────────────────────────────────────
create table if not exists public.ledger_accounts (
  id text primary key,
  code text not null default '',
  name text not null default '',
  type text not null default 'Expense',          -- Asset | Liability | Equity | Income | Expense
  sub_type text not null default '',             -- free-text grouping, e.g. "Cost of Sales"
  vat_applicable boolean not null default false,
  active boolean not null default true,
  notes text not null default ''
);

create index if not exists ledger_accounts_type_idx on public.ledger_accounts(type);
create index if not exists ledger_accounts_code_idx on public.ledger_accounts(code);

alter table public.ledger_accounts enable row level security;

drop policy if exists ledger_accounts_select on public.ledger_accounts;
create policy ledger_accounts_select on public.ledger_accounts for select to authenticated using (true);
drop policy if exists ledger_accounts_insert on public.ledger_accounts;
create policy ledger_accounts_insert on public.ledger_accounts for insert to authenticated with check (true);
drop policy if exists ledger_accounts_update on public.ledger_accounts;
create policy ledger_accounts_update on public.ledger_accounts for update to authenticated using (true) with check (true);
drop policy if exists ledger_accounts_delete on public.ledger_accounts;
create policy ledger_accounts_delete on public.ledger_accounts for delete to authenticated using (true);

-- ── Accounts Payable (supplier bills) ──────────────────────────────────────
create table if not exists public.supplier_bills (
  id text primary key,
  bill_number text not null,
  supplier_invoice_number text not null default '',
  created_at timestamptz not null default now(),
  bill_date text not null default '',
  due_date text not null default '',
  supplier_id text default '',
  supplier_name text not null default '',
  expense_account_id text default '',
  expense_account_name text not null default '',
  currency text not null default 'ZAR',
  subtotal_excl_vat numeric(16, 2) not null default 0,
  vat_amount numeric(16, 2) not null default 0,
  total_incl_vat numeric(16, 2) not null default 0,
  payments jsonb not null default '[]'::jsonb,
  amount_paid numeric(16, 2) not null default 0,
  amount_outstanding numeric(16, 2) not null default 0,
  status text not null default 'Unpaid',         -- Unpaid | Partially Paid | Paid | Disputed | Cancelled
  source_shipment_id text default '',
  source_inbox_id text default '',
  notes text not null default ''
);

create index if not exists supplier_bills_supplier_idx on public.supplier_bills(supplier_id);
create index if not exists supplier_bills_status_idx on public.supplier_bills(status);
create index if not exists supplier_bills_due_idx on public.supplier_bills(due_date);
create index if not exists supplier_bills_account_idx on public.supplier_bills(expense_account_id);

alter table public.supplier_bills enable row level security;

drop policy if exists supplier_bills_select on public.supplier_bills;
create policy supplier_bills_select on public.supplier_bills for select to authenticated using (true);
drop policy if exists supplier_bills_insert on public.supplier_bills;
create policy supplier_bills_insert on public.supplier_bills for insert to authenticated with check (true);
drop policy if exists supplier_bills_update on public.supplier_bills;
create policy supplier_bills_update on public.supplier_bills for update to authenticated using (true) with check (true);
drop policy if exists supplier_bills_delete on public.supplier_bills;
create policy supplier_bills_delete on public.supplier_bills for delete to authenticated using (true);

-- ── Seed a default South African small-business chart of accounts ───────────
-- Mirrors buildDefaultChartOfAccounts() in src/types/index.ts. ON CONFLICT
-- DO NOTHING means re-running never overwrites edits the bookkeeper has made.
insert into public.ledger_accounts (id, code, name, type, sub_type, vat_applicable, active, notes) values
  ('acct-1000', '1000', 'Bank — Current Account',            'Asset',     'Current Asset',       false, true, ''),
  ('acct-1100', '1100', 'Accounts Receivable (Debtors)',     'Asset',     'Current Asset',       false, true, ''),
  ('acct-1200', '1200', 'Inventory — Raw Materials',         'Asset',     'Current Asset',       false, true, ''),
  ('acct-1210', '1210', 'Inventory — Finished Goods',        'Asset',     'Current Asset',       false, true, ''),
  ('acct-1400', '1400', 'VAT Input (claimable)',             'Asset',     'Tax',                 false, true, ''),
  ('acct-1500', '1500', 'Plant & Machinery',                 'Asset',     'Fixed Asset',         true,  true, ''),
  ('acct-1510', '1510', 'Office & Computer Equipment',       'Asset',     'Fixed Asset',         true,  true, ''),
  ('acct-1520', '1520', 'Motor Vehicles',                    'Asset',     'Fixed Asset',         true,  true, ''),
  ('acct-2000', '2000', 'Accounts Payable (Creditors)',      'Liability', 'Current Liability',   false, true, ''),
  ('acct-2100', '2100', 'VAT Output (payable)',              'Liability', 'Tax',                 false, true, ''),
  ('acct-2200', '2200', 'PAYE / SDL / UIF Payable',          'Liability', 'Payroll Liability',   false, true, ''),
  ('acct-2300', '2300', 'Loans Payable',                     'Liability', 'Long-term Liability', false, true, ''),
  ('acct-3000', '3000', 'Owner''s Capital',                  'Equity',    'Equity',              false, true, ''),
  ('acct-3100', '3100', 'Retained Earnings',                 'Equity',    'Equity',              false, true, ''),
  ('acct-3200', '3200', 'Owner''s Drawings',                 'Equity',    'Equity',              false, true, ''),
  ('acct-4000', '4000', 'Sales — Paper Bags',               'Income',    'Revenue',             true,  true, ''),
  ('acct-4010', '4010', 'Sales — Printing & Plates',        'Income',    'Revenue',             true,  true, ''),
  ('acct-4900', '4900', 'Other Income',                      'Income',    'Revenue',             true,  true, ''),
  ('acct-5000', '5000', 'Paper & Board',                     'Expense',   'Cost of Sales',       true,  true, ''),
  ('acct-5010', '5010', 'Ink & Coatings',                    'Expense',   'Cost of Sales',       true,  true, ''),
  ('acct-5020', '5020', 'Plates & Origination',              'Expense',   'Cost of Sales',       true,  true, ''),
  ('acct-5030', '5030', 'Glue & Consumables',                'Expense',   'Cost of Sales',       true,  true, ''),
  ('acct-5040', '5040', 'Outsourced / Subcontract',          'Expense',   'Cost of Sales',       true,  true, ''),
  ('acct-5050', '5050', 'Freight & Import Duty',             'Expense',   'Cost of Sales',       true,  true, ''),
  ('acct-6000', '6000', 'Salaries & Wages',                  'Expense',   'Overheads',           false, true, ''),
  ('acct-6010', '6010', 'Rent',                              'Expense',   'Overheads',           true,  true, ''),
  ('acct-6020', '6020', 'Electricity & Water',               'Expense',   'Overheads',           true,  true, ''),
  ('acct-6030', '6030', 'Machine Maintenance & Spares',      'Expense',   'Overheads',           true,  true, ''),
  ('acct-6040', '6040', 'Vehicle & Fuel',                    'Expense',   'Overheads',           true,  true, ''),
  ('acct-6050', '6050', 'Telephone & Internet',              'Expense',   'Overheads',           true,  true, ''),
  ('acct-6060', '6060', 'Insurance',                         'Expense',   'Overheads',           true,  true, ''),
  ('acct-6070', '6070', 'Bank Charges',                      'Expense',   'Overheads',           false, true, ''),
  ('acct-6080', '6080', 'Professional Fees (Accounting/Legal)', 'Expense','Overheads',           true,  true, ''),
  ('acct-6090', '6090', 'Cleaning & Sanitation',             'Expense',   'Overheads',           true,  true, ''),
  ('acct-6100', '6100', 'Office & Admin',                    'Expense',   'Overheads',           true,  true, ''),
  ('acct-6110', '6110', 'Marketing & Advertising',           'Expense',   'Overheads',           true,  true, ''),
  ('acct-6120', '6120', 'Software & Subscriptions',          'Expense',   'Overheads',           true,  true, ''),
  ('acct-6130', '6130', 'Staff Training & PPE',              'Expense',   'Overheads',           true,  true, ''),
  ('acct-6140', '6140', 'Pest Control & Compliance',         'Expense',   'Overheads',           true,  true, ''),
  ('acct-6900', '6900', 'Sundry / Other Expenses',           'Expense',   'Overheads',           true,  true, '')
on conflict (id) do nothing;

notify pgrst, 'reload schema';
