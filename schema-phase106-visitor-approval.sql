-- ─────────────────────────────────────────────────────────────────────────
-- Phase 106 — Visitor Area Approval System.
--
-- Four idempotent changes (safe to re-run):
--   1. employees: add availability_status, backup_approver_employee_id,
--      delegate_approval_to_employee_id, can_approve_visitor_areas.
--      Drives the Phase 106.3 routing engine — host availability +
--      auto-escalation to backup.
--   2. app_settings: add visitor_area_policy (jsonb per-area override)
--      and visitor_approval_escalation_minutes (int, default 5).
--   3. visitor_area_approval_requests: full state machine record with
--      append-only history audit trail.
--   4. visitor_bookings: pre-approved visitor invites with allowed-area
--      list + time window.
--
-- Reference doc: docstring at the top of types/index.ts → search 106.
-- ─────────────────────────────────────────────────────────────────────────

-- ── 1) employees — host availability + approval routing fields ────────────
alter table if exists public.employees
  add column if not exists availability_status text default 'Available',
  add column if not exists backup_approver_employee_id text,
  add column if not exists delegate_approval_to_employee_id text,
  add column if not exists can_approve_visitor_areas boolean default true;

comment on column public.employees.availability_status is
  'Phase 106.3 — Available | Busy | On the road | In a meeting | Away | Delegate. Drives visitor approval routing: anything other than Available auto-routes to the backup.';
comment on column public.employees.backup_approver_employee_id is
  'Phase 106.3 — id of the employee who picks up visitor approvals when this person is unavailable or doesn''t respond in time.';
comment on column public.employees.delegate_approval_to_employee_id is
  'Phase 106.3 — when availability_status = Delegate, requests go here instead of the backup.';
comment on column public.employees.can_approve_visitor_areas is
  'Phase 106.3 — when false, this employee never receives visitor approval requests (use for production-only staff).';

-- Helpful index for the routing engine — quickly find available approvers.
create index if not exists employees_availability_idx
  on public.employees(availability_status) where active is true;

-- ── 2) app_settings — visitor area policy + escalation timer ──────────────
alter table if exists public.app_settings
  add column if not exists visitor_area_policy jsonb default '{}'::jsonb,
  add column if not exists visitor_approval_escalation_minutes integer default 5;

comment on column public.app_settings.visitor_area_policy is
  'Phase 106.1 — admin override map of FactoryArea → ''safe'' | ''restricted''. Empty object = use DEFAULT_AREA_SAFETY in code.';
comment on column public.app_settings.visitor_approval_escalation_minutes is
  'Phase 106.3 — minutes before an unanswered approval auto-routes to the backup approver. Default 5.';

-- ── 3) visitor_area_approval_requests ─────────────────────────────────────
create table if not exists public.visitor_area_approval_requests (
  id text primary key,
  visitor_log_entry_id text not null,
  visitor_name text not null,
  visitor_company text default '',
  host_employee_id text default '',
  host_name text not null,
  requested_areas jsonb not null default '[]'::jsonb,
  approved_areas  jsonb not null default '[]'::jsonb,
  status text not null default 'pending',
  current_approver_employee_id text default '',
  current_approver_name text not null,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  expires_at timestamptz,
  history jsonb not null default '[]'::jsonb,
  request_note text default '',
  satisfied_by_booking_id text
);

comment on table public.visitor_area_approval_requests is
  'Phase 106.2 — host approval state machine for restricted-area visitor access. history[] is append-only audit trail.';

create index if not exists visitor_approval_status_idx
  on public.visitor_area_approval_requests(status);
create index if not exists visitor_approval_current_approver_idx
  on public.visitor_area_approval_requests(current_approver_employee_id) where status in ('pending', 'delegated', 'escalated');
create index if not exists visitor_approval_created_at_idx
  on public.visitor_area_approval_requests(created_at desc);

-- ── 4) visitor_bookings ───────────────────────────────────────────────────
create table if not exists public.visitor_bookings (
  id text primary key,
  visitor_name text not null,
  visitor_company text default '',
  visitor_email text default '',
  visitor_phone text default '',
  host_employee_id text not null,
  host_name text not null,
  visit_date date not null,
  start_time text default '',
  end_time text default '',
  allowed_areas jsonb not null default '[]'::jsonb,
  purpose text default '',
  notes text default '',
  status text not null default 'created',
  created_at timestamptz not null default now(),
  created_by_name text default '',
  checked_in_at timestamptz,
  visitor_log_entry_id text
);

comment on table public.visitor_bookings is
  'Phase 106.4 — pre-approved visitor invites. findVisitorBooking() matches name+date on arrival and skips host approval for allowed areas.';

create index if not exists visitor_bookings_date_idx
  on public.visitor_bookings(visit_date);
create index if not exists visitor_bookings_host_idx
  on public.visitor_bookings(host_employee_id);
create index if not exists visitor_bookings_status_idx
  on public.visitor_bookings(status) where status in ('created', 'active');

-- ── 5) RLS — match project pattern (authenticated full access) ────────────
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='visitor_area_approval_requests') then
    execute 'alter table public.visitor_area_approval_requests enable row level security';
    execute $sql$create policy "visitor_area_approval_requests authenticated full" on public.visitor_area_approval_requests
      for all to authenticated using (true) with check (true)$sql$;
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='visitor_bookings') then
    execute 'alter table public.visitor_bookings enable row level security';
    execute $sql$create policy "visitor_bookings authenticated full" on public.visitor_bookings
      for all to authenticated using (true) with check (true)$sql$;
  end if;
end $$;
