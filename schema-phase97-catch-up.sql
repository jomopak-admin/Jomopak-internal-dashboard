-- Phase 97 — Catch-up migration.
--
-- Based on schema-discovery.sql output: only 6 tables are missing.
-- This file creates all 6 idempotently so you can run it once and be done.
-- After this runs, the app stops falling back to localStorage entirely.
--
-- Tables created:
--   1. first_aid_entries        (Phase 82 — First Aid Register)
--   2. first_aid_aiders         (Phase 82 — Designated First Aiders)
--   3. incident_entries         (Phase 95.1 — Incident & Accident Register)
--   4. drill_entries            (Phase 95.2 — Fire / Evacuation Drill Register)
--   5. toolbox_talk_entries     (Phase 95.3 — Toolbox Talks Register)
--   6. she_meeting_entries      (Phase 95.4 — SHE Committee Meetings)

-- ═════════════════════════════════════════════════════════════════════════
-- 1. First Aid Entries (Phase 82)
-- ═════════════════════════════════════════════════════════════════════════
create table if not exists public.first_aid_entries (
  id                      text primary key,
  entry_number            text not null,
  created_at              timestamptz not null default now(),
  incident_date           date,
  incident_time           text,
  injured_person_employee_id text,
  injured_person_name     text,
  injured_person_role     text,
  is_visitor              boolean not null default false,
  injury_type             text,
  body_part               text,
  location                text,
  description             text,
  treatment_given         text,
  dressings_used          text,
  treated_by_aider_id     text,
  treated_by_name         text,
  referred_to_doctor      boolean not null default false,
  referred_to             text,
  iod_case                boolean not null default false,
  iod_reference           text,
  witness_name            text,
  photo_urls              jsonb not null default '[]'::jsonb,
  signature_url           text,
  notes                   text not null default ''
);
create index if not exists first_aid_entries_date_idx on public.first_aid_entries (incident_date);
comment on table public.first_aid_entries is
  'Phase 82. First Aid Treatment Register — each treatment given on site, dressings used, referrals.';

-- ═════════════════════════════════════════════════════════════════════════
-- 2. First Aid Aiders (Phase 82)
-- ═════════════════════════════════════════════════════════════════════════
create table if not exists public.first_aid_aiders (
  employee_id             text primary key,
  full_name               text not null,
  cert_level              text,
  cert_number             text,
  cert_issued_date        date,
  cert_expiry_date        date,
  phone_number            text,
  notes                   text not null default '',
  active                  boolean not null default true
);
create index if not exists first_aid_aiders_active_idx on public.first_aid_aiders (active);
comment on table public.first_aid_aiders is
  'Phase 82. Designated First Aiders register — name, cert level, expiry.';

-- ═════════════════════════════════════════════════════════════════════════
-- 3. Incident & Accident Register (Phase 95.1)
-- ═════════════════════════════════════════════════════════════════════════
create table if not exists public.incident_entries (
  id                          text primary key,
  incident_number             text not null,
  created_at                  timestamptz not null default now(),
  incident_date               date not null,
  incident_time               text,
  incident_type               text not null,
  severity                    text not null,
  person_employee_id          text,
  person_name                 text not null,
  person_role                 text,
  is_contractor               boolean not null default false,
  body_part_affected          text,
  location                    text,
  description                 text not null,
  immediate_action            text,
  treatment_given             text,
  treated_by_name             text,
  first_aider_employee_id     text,
  witness_name                text,
  root_cause                  text,
  corrective_action           text,
  linked_ncr_id               text,
  iod_submitted               boolean not null default false,
  iod_reference               text,
  days_lost                   numeric(6,2) not null default 0,
  return_to_work_date         date,
  closed_at                   date,
  closed_by_name              text,
  reporter_name               text,
  reporter_signature_url      text,
  photo_urls                  jsonb not null default '[]'::jsonb,
  notes                       text not null default ''
);
create index if not exists incident_entries_date_idx on public.incident_entries (incident_date);
create index if not exists incident_entries_type_idx on public.incident_entries (incident_type);
comment on table public.incident_entries is
  'Phase 95.1. SMETA Incident & Accident Register.';

-- ═════════════════════════════════════════════════════════════════════════
-- 4. Drill Register (Phase 95.2)
-- ═════════════════════════════════════════════════════════════════════════
create table if not exists public.drill_entries (
  id                          text primary key,
  drill_number                text not null,
  created_at                  timestamptz not null default now(),
  drill_date                  date not null,
  drill_type                  text not null,
  scenario                    text not null,
  alarm_raised_time           text,
  evacuation_complete_time    text,
  total_minutes               numeric(6,2) not null default 0,
  headcount_expected          integer not null default 0,
  headcount_at_muster         integer not null default 0,
  missing_persons             text,
  fire_marshal_name           text,
  fire_marshal_signature_url  text,
  observations                text,
  lessons_learned             text,
  outcome                     text not null,
  photo_urls                  jsonb not null default '[]'::jsonb,
  notes                       text not null default ''
);
create index if not exists drill_entries_date_idx on public.drill_entries (drill_date);
comment on table public.drill_entries is
  'Phase 95.2. SMETA Fire / Evacuation Drill Register.';

-- ═════════════════════════════════════════════════════════════════════════
-- 5. Toolbox Talks Register (Phase 95.3)
-- ═════════════════════════════════════════════════════════════════════════
create table if not exists public.toolbox_talk_entries (
  id                          text primary key,
  talk_number                 text not null,
  created_at                  timestamptz not null default now(),
  talk_date                   date not null,
  topic                       text not null,
  key_points                  text,
  discussion                  text,
  facilitator_name            text,
  facilitator_signature_url   text,
  duration_minutes            numeric(6,2) not null default 0,
  attendees                   jsonb not null default '[]'::jsonb,
  photo_urls                  jsonb not null default '[]'::jsonb,
  notes                       text not null default ''
);
create index if not exists toolbox_talk_entries_date_idx on public.toolbox_talk_entries (talk_date);
comment on table public.toolbox_talk_entries is
  'Phase 95.3. SMETA Toolbox Talks Register.';

-- ═════════════════════════════════════════════════════════════════════════
-- 6. SHE Committee Meetings (Phase 95.4)
-- ═════════════════════════════════════════════════════════════════════════
create table if not exists public.she_meeting_entries (
  id                          text primary key,
  meeting_number              text not null,
  created_at                  timestamptz not null default now(),
  meeting_date                date not null,
  meeting_time                text,
  chairperson_name            text,
  scribe_name                 text,
  attendees                   jsonb not null default '[]'::jsonb,
  agenda                      text,
  minutes                     text,
  action_items                jsonb not null default '[]'::jsonb,
  next_meeting_date           date,
  photo_urls                  jsonb not null default '[]'::jsonb,
  notes                       text not null default ''
);
create index if not exists she_meeting_entries_date_idx on public.she_meeting_entries (meeting_date);
comment on table public.she_meeting_entries is
  'Phase 95.4. SMETA SHE Committee Meeting Register.';

-- ═════════════════════════════════════════════════════════════════════════
-- RLS policies for all 6 — authenticated users full access.
-- Tighten later per role if needed (production / sales shouldn't see SHE
-- minutes, etc.) — but keep open now so the app just works.
-- ═════════════════════════════════════════════════════════════════════════
alter table public.first_aid_entries     enable row level security;
alter table public.first_aid_aiders      enable row level security;
alter table public.incident_entries      enable row level security;
alter table public.drill_entries         enable row level security;
alter table public.toolbox_talk_entries  enable row level security;
alter table public.she_meeting_entries   enable row level security;

do $$ begin create policy first_aid_entries_all     on public.first_aid_entries     for all to authenticated using (true) with check (true); exception when duplicate_object then null; end $$;
do $$ begin create policy first_aid_aiders_all      on public.first_aid_aiders      for all to authenticated using (true) with check (true); exception when duplicate_object then null; end $$;
do $$ begin create policy incident_entries_all      on public.incident_entries      for all to authenticated using (true) with check (true); exception when duplicate_object then null; end $$;
do $$ begin create policy drill_entries_all         on public.drill_entries         for all to authenticated using (true) with check (true); exception when duplicate_object then null; end $$;
do $$ begin create policy toolbox_talk_entries_all  on public.toolbox_talk_entries  for all to authenticated using (true) with check (true); exception when duplicate_object then null; end $$;
do $$ begin create policy she_meeting_entries_all   on public.she_meeting_entries   for all to authenticated using (true) with check (true); exception when duplicate_object then null; end $$;
