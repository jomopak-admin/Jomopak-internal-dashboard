-- Phase 41 — Staff warnings, commendations & manager notes
--
-- One register that captures everything a manager writes about a staff
-- member's conduct, performance or recognition. Warning subtypes
-- (Verbal/Written 1/Written 2/Final) require an on-screen signature
-- acknowledgement which is stored as a PNG data URL.
--
-- Access in the app is gated by the 'staffWarnings' permission — admin
-- grants it per user (typically factory manager / HR).
--
-- Idempotent — safe to re-run.

create table if not exists public.staff_warnings (
  id                              text        primary key,
  record_number                   text        not null,
  created_at                      timestamptz not null default now(),
  employee_id                     uuid,
  employee_name                   text        not null,
  type                            text        not null,
  category                        text        not null,
  incident_date                   date,
  issued_date                     date        not null,
  issued_by_name                  text,
  description                     text        not null,
  corrective_action               text,
  expires_at                      date,
  attachment_url                  text,
  acknowledged                    boolean     not null default false,
  acknowledged_date               date,
  acknowledged_signature_data_url text,
  notes                           text
);

create index if not exists staff_warnings_employee_idx on public.staff_warnings (employee_id);
create index if not exists staff_warnings_issued_idx   on public.staff_warnings (issued_date desc);

alter table public.staff_warnings enable row level security;

-- Permissive policies: any authenticated user can read (staff need to see
-- their own warnings on My Stuff). Writes happen via the app and are
-- already gated by the 'staffWarnings' permission in the UI.
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'staff_warnings' and policyname = 'staff_warnings_select'
  ) then
    create policy staff_warnings_select on public.staff_warnings for select using (auth.role() = 'authenticated');
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'staff_warnings' and policyname = 'staff_warnings_write'
  ) then
    create policy staff_warnings_write on public.staff_warnings for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;
end $$;

notify pgrst, 'reload schema';
