-- Phase 30 — Maintenance scheduler / work orders
--
--   * maintenance_work_orders — preventive + corrective maintenance against
--     machines. Completing a preventive WO advances the machine's next service
--     date (handled in the app).
--
-- Idempotent — safe to re-run.

create table if not exists public.maintenance_work_orders (
  id text primary key,
  wo_number text not null,
  machine_id text default '',
  machine_name text not null default '',
  type text not null default 'Preventive',         -- Preventive | Corrective | Inspection | Breakdown
  priority text not null default 'Medium',          -- Low | Medium | High | Critical
  status text not null default 'Open',              -- Open | In Progress | Completed | Cancelled
  scheduled_date text not null default '',
  completed_date text not null default '',
  assigned_to text not null default '',
  description text not null default '',
  parts_used text not null default '',
  labour_hours numeric(10, 2) not null default 0,
  downtime_hours numeric(10, 2) not null default 0,
  cost numeric(16, 2) not null default 0,
  next_service_interval_days integer not null default 0,
  created_at timestamptz not null default now(),
  notes text not null default ''
);

create index if not exists mwo_machine_idx on public.maintenance_work_orders(machine_id);
create index if not exists mwo_status_idx on public.maintenance_work_orders(status);
create index if not exists mwo_scheduled_idx on public.maintenance_work_orders(scheduled_date);

alter table public.maintenance_work_orders enable row level security;

drop policy if exists mwo_select on public.maintenance_work_orders;
create policy mwo_select on public.maintenance_work_orders for select to authenticated using (true);
drop policy if exists mwo_insert on public.maintenance_work_orders;
create policy mwo_insert on public.maintenance_work_orders for insert to authenticated with check (true);
drop policy if exists mwo_update on public.maintenance_work_orders;
create policy mwo_update on public.maintenance_work_orders for update to authenticated using (true) with check (true);
drop policy if exists mwo_delete on public.maintenance_work_orders;
create policy mwo_delete on public.maintenance_work_orders for delete to authenticated using (true);

notify pgrst, 'reload schema';
