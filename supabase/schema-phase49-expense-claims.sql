-- Phase 49 — Expense / claim requests
-- Staff submits → manager approves → accountant pays. Idempotent.

create table if not exists public.expense_claims (
  id                text        primary key,
  claim_number      text        not null,
  created_at        timestamptz not null default now(),
  employee_id       uuid,
  employee_name     text        not null,
  category          text        not null,
  incident_date     date,
  amount            numeric     not null default 0,
  description       text        not null,
  receipt_url       text,
  job_id            text,
  job_number        text,
  status            text        not null default 'Pending',
  approved_by_name  text,
  approved_at       timestamptz,
  approval_notes    text,
  paid_by_name      text,
  paid_at           timestamptz,
  pay_method        text
);

create index if not exists expense_claims_status_idx   on public.expense_claims (status);
create index if not exists expense_claims_employee_idx on public.expense_claims (employee_id);
create index if not exists expense_claims_created_idx  on public.expense_claims (created_at desc);

alter table public.expense_claims enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='expense_claims' and policyname='expense_claims_select') then
    create policy expense_claims_select on public.expense_claims for select using (auth.role()='authenticated');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='expense_claims' and policyname='expense_claims_write') then
    create policy expense_claims_write on public.expense_claims for all using (auth.role()='authenticated') with check (auth.role()='authenticated');
  end if;
end $$;

notify pgrst, 'reload schema';
