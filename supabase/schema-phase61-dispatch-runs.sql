-- Phase 61 — Dispatch Runs (Route Sheets)
-- A higher-level concept than dispatch_records: one driver + one
-- vehicle + one day + an ordered list of delivery notes (stops).
-- Drives the driver's PWA experience and gives dispatch supervisors a
-- planning surface. Existing dispatch_records / delivery_notes stay
-- untouched; this adds an OPTIONAL back-reference.
-- Idempotent. Safe to re-run.

create table if not exists public.dispatch_runs (
  id                    text primary key,
  run_number            text not null,
  created_at            timestamptz not null default now(),
  run_date              date not null,
  driver_user_id        text,
  driver_name           text not null default '',
  vehicle_registration  text not null default '',
  vehicle_description   text not null default '',
  status                text not null default 'Planned',  -- Planned | Loaded | In Progress | Completed | Cancelled
  -- Ordered stops as a jsonb array of { sequence, deliveryNoteId, ... }
  stops                 jsonb not null default '[]'::jsonb,
  planned_at            timestamptz,
  loaded_at             timestamptz,
  loaded_by_name        text not null default '',
  departure_time        timestamptz,
  return_time           timestamptz,
  completed_at          timestamptz,
  odometer_start        numeric not null default 0,
  odometer_end          numeric not null default 0,
  notes                 text not null default '',
  -- Optimistic concurrency
  version               integer not null default 1,
  row_updated_at        timestamptz not null default now()
);

create index if not exists dispatch_runs_run_date_idx on public.dispatch_runs (run_date desc);
create index if not exists dispatch_runs_driver_idx   on public.dispatch_runs (driver_user_id);
create index if not exists dispatch_runs_status_idx   on public.dispatch_runs (status);

-- Auto-bump version + row_updated_at on UPDATE so the existing
-- optimistic-concurrency middleware (Phase 14) keeps working.
create or replace function public.dispatch_runs_touch()
returns trigger
language plpgsql as $$
begin
  new.version := coalesce(old.version, 1) + 1;
  new.row_updated_at := now();
  return new;
end;
$$;

drop trigger if exists dispatch_runs_touch_trg on public.dispatch_runs;
create trigger dispatch_runs_touch_trg
  before update on public.dispatch_runs
  for each row execute function public.dispatch_runs_touch();

-- ──────────────────────────────────────────────────────────────────────
-- Back-reference on delivery_notes — which run is this DN assigned to?
-- Empty for DNs not yet bundled into a run (the "ready to ship" queue).
-- ──────────────────────────────────────────────────────────────────────
alter table public.delivery_notes
  add column if not exists dispatch_run_id     text references public.dispatch_runs(id) on delete set null,
  add column if not exists dispatch_run_number text;

create index if not exists delivery_notes_dispatch_run_idx
  on public.delivery_notes (dispatch_run_id)
  where dispatch_run_id is not null;

-- ──────────────────────────────────────────────────────────────────────
-- RLS — same posture as the rest of the workspace: any signed-in user
-- can read; writes gated to authenticated users. Tighter per-role
-- restrictions can be layered on top via the existing permissions UI.
-- ──────────────────────────────────────────────────────────────────────
alter table public.dispatch_runs enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='dispatch_runs' and policyname='dispatch_runs_read'
  ) then
    create policy dispatch_runs_read on public.dispatch_runs for select using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='dispatch_runs' and policyname='dispatch_runs_write'
  ) then
    create policy dispatch_runs_write on public.dispatch_runs for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;
end $$;

notify pgrst, 'reload schema';
