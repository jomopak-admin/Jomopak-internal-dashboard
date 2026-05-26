-- Phase 40 — Staff portal
--
-- Two changes to support the "My Stuff" page each staff member sees when they
-- log in:
--
--   1. profiles.linked_employee_id — links a UserProfile (auth user) to an
--      Employee record, so the staff member's payslips show up on their
--      portal page. Optional; falls back to fullName match if not set.
--
--   2. notices — a small notice board. Pinned notices show first on the
--      portal home; expired ones drop off. audience_roles is jsonb so admins
--      can target specific roles, or null/empty to send to everyone.
--
-- Idempotent — safe to re-run.

-- (1) ----------------------------------------------------------------------
alter table public.profiles add column if not exists linked_employee_id uuid;

-- (2) ----------------------------------------------------------------------
create table if not exists public.notices (
  id              text primary key,
  title           text        not null,
  body            text        not null default '',
  posted_at       timestamptz not null default now(),
  posted_by_name  text,
  expires_at      date,
  audience_roles  jsonb,
  pinned          boolean     not null default false,
  created_at      timestamptz not null default now()
);

alter table public.notices enable row level security;

-- Permissive policies: any authenticated user can read; writes are gated by
-- the app's UI (only admins reach the Notices page).
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'notices' and policyname = 'notices_select'
  ) then
    create policy notices_select on public.notices for select using (auth.role() = 'authenticated');
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'notices' and policyname = 'notices_write'
  ) then
    create policy notices_write on public.notices for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;
end $$;

notify pgrst, 'reload schema';
