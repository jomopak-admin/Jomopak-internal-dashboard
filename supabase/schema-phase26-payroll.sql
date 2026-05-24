-- Phase 26 — Payroll
--
--   * employees     — the staff register (pay, bank details, tax/ID numbers).
--   * payroll_runs  — one row per pay period, with payslips stored as a jsonb
--                     array and the run totals that feed EMP201.
--
-- Manual-entry payroll: PAYE is captured by the operator/accountant, not
-- computed from tax tables. Idempotent — safe to re-run.

-- ── Employees ───────────────────────────────────────────────────────────────
create table if not exists public.employees (
  id text primary key,
  employee_number text not null default '',
  first_name text not null default '',
  last_name text not null default '',
  id_number text not null default '',
  tax_number text not null default '',
  email text not null default '',
  phone text not null default '',
  job_title text not null default '',
  department text not null default '',
  pay_cycle text not null default 'Monthly',
  basic_salary numeric(16, 2) not null default 0,
  bank_name text not null default '',
  bank_account_number text not null default '',
  bank_branch_code text not null default '',
  account_type text not null default '',
  uif_contributor boolean not null default true,
  start_date text not null default '',
  end_date text not null default '',
  active boolean not null default true,
  notes text not null default ''
);

create index if not exists employees_active_idx on public.employees(active);

alter table public.employees enable row level security;

drop policy if exists employees_select on public.employees;
create policy employees_select on public.employees for select to authenticated using (true);
drop policy if exists employees_insert on public.employees;
create policy employees_insert on public.employees for insert to authenticated with check (true);
drop policy if exists employees_update on public.employees;
create policy employees_update on public.employees for update to authenticated using (true) with check (true);
drop policy if exists employees_delete on public.employees;
create policy employees_delete on public.employees for delete to authenticated using (true);

-- ── Payroll runs ────────────────────────────────────────────────────────────
create table if not exists public.payroll_runs (
  id text primary key,
  run_number text not null,
  created_at timestamptz not null default now(),
  pay_cycle text not null default 'Monthly',
  period_month integer not null default 0,
  period_year integer not null default 0,
  period_label text not null default '',
  pay_date text not null default '',
  status text not null default 'Draft',          -- Draft | Approved | Paid
  payslips jsonb not null default '[]'::jsonb,
  total_gross numeric(16, 2) not null default 0,
  total_paye numeric(16, 2) not null default 0,
  total_uif_employee numeric(16, 2) not null default 0,
  total_uif_employer numeric(16, 2) not null default 0,
  total_sdl numeric(16, 2) not null default 0,
  total_other_deductions numeric(16, 2) not null default 0,
  total_net numeric(16, 2) not null default 0,
  notes text not null default ''
);

create index if not exists payroll_runs_period_idx on public.payroll_runs(period_year, period_month);
create index if not exists payroll_runs_status_idx on public.payroll_runs(status);

alter table public.payroll_runs enable row level security;

drop policy if exists payroll_runs_select on public.payroll_runs;
create policy payroll_runs_select on public.payroll_runs for select to authenticated using (true);
drop policy if exists payroll_runs_insert on public.payroll_runs;
create policy payroll_runs_insert on public.payroll_runs for insert to authenticated with check (true);
drop policy if exists payroll_runs_update on public.payroll_runs;
create policy payroll_runs_update on public.payroll_runs for update to authenticated using (true) with check (true);
drop policy if exists payroll_runs_delete on public.payroll_runs;
create policy payroll_runs_delete on public.payroll_runs for delete to authenticated using (true);

notify pgrst, 'reload schema';
