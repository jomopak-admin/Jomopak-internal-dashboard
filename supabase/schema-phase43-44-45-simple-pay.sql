-- Phases 43, 44, 45 — Simple Pay-style features
--
-- 43: Leave management with BCEA defaults (Annual / Sick / Family Resp etc.)
-- 44: Staff loans + monthly repayment that auto-deducts when a payroll
--     run is Approved.
-- 45: Payroll adjustments (bonus / 13th cheque / commission) — stored on
--     payroll_runs.adjustments as jsonb; applied during run approval.
--
-- All idempotent. Safe to re-run.

-- ─────── Phase 43: leave_requests ────────────────────────────────────────
create table if not exists public.leave_requests (
  id                 text        primary key,
  request_number     text        not null,
  created_at         timestamptz not null default now(),
  employee_id        uuid,
  employee_name      text        not null,
  type               text        not null,
  start_date         date        not null,
  end_date           date        not null,
  days               numeric     not null default 0,
  reason             text,
  status             text        not null default 'Pending',
  approved_by_name   text,
  approved_at        timestamptz,
  approval_notes     text,
  attachment_url     text
);

create index if not exists leave_requests_employee_idx on public.leave_requests (employee_id);
create index if not exists leave_requests_status_idx   on public.leave_requests (status);
create index if not exists leave_requests_created_idx  on public.leave_requests (created_at desc);

alter table public.leave_requests enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'leave_requests' and policyname = 'leave_requests_select') then
    create policy leave_requests_select on public.leave_requests for select using (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'leave_requests' and policyname = 'leave_requests_write') then
    create policy leave_requests_write on public.leave_requests for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;
end $$;

-- ─────── Phase 44: staff_loans ───────────────────────────────────────────
create table if not exists public.staff_loans (
  id                   text        primary key,
  loan_number          text        not null,
  created_at           timestamptz not null default now(),
  employee_id          uuid,
  employee_name        text        not null,
  principal_amount     numeric     not null default 0,
  monthly_repayment    numeric     not null default 0,
  start_date           date,
  expected_end_date    date,
  balance              numeric     not null default 0,
  status               text        not null default 'Active',
  reason               text,
  notes                text
);

create index if not exists staff_loans_employee_idx on public.staff_loans (employee_id);
create index if not exists staff_loans_status_idx   on public.staff_loans (status);

alter table public.staff_loans enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'staff_loans' and policyname = 'staff_loans_select') then
    create policy staff_loans_select on public.staff_loans for select using (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'staff_loans' and policyname = 'staff_loans_write') then
    create policy staff_loans_write on public.staff_loans for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;
end $$;

-- ─────── Phase 45: payroll_runs.adjustments (jsonb) ──────────────────────
alter table public.payroll_runs add column if not exists adjustments jsonb;

notify pgrst, 'reload schema';
