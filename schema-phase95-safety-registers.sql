-- Phase 95 — SMETA Safety Registers.
--
-- Four new tables for the live registers SMETA auditors expect:
--   incident_entries        — incidents / accidents / IOD / near-misses
--   drill_entries           — fire & evacuation drills
--   toolbox_talk_entries    — safety talks with signed attendance
--   she_meeting_entries     — SHE committee minutes + action items
--
-- All idempotent (`if not exists`). RLS allowed for authenticated users
-- — tighten later if production / sales should not see SHE minutes.

-- ════════════════════════════════════════════════════════════════════════
-- Incident & Accident Register
-- ════════════════════════════════════════════════════════════════════════
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
  'Phase 95.1. SMETA Incident & Accident Register — injuries, near-misses, IOD, property damage, environmental.';

-- ════════════════════════════════════════════════════════════════════════
-- Fire / Evacuation Drill Register
-- ════════════════════════════════════════════════════════════════════════
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
  'Phase 95.2. SMETA Fire / Evacuation Drill Register — drill cadence + time-to-evacuate.';

-- ════════════════════════════════════════════════════════════════════════
-- Toolbox Talks Register
-- ════════════════════════════════════════════════════════════════════════
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
  'Phase 95.3. SMETA Toolbox Talks Register — pre-shift / topic safety briefings with signed attendees jsonb.';

-- ════════════════════════════════════════════════════════════════════════
-- SHE Committee Meeting Register
-- ════════════════════════════════════════════════════════════════════════
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
  'Phase 95.4. SMETA SHE Committee Meeting Register — minutes + jsonb attendees + jsonb action items.';

-- ════════════════════════════════════════════════════════════════════════
-- RLS
-- ════════════════════════════════════════════════════════════════════════
alter table public.incident_entries     enable row level security;
alter table public.drill_entries        enable row level security;
alter table public.toolbox_talk_entries enable row level security;
alter table public.she_meeting_entries  enable row level security;

do $$ begin create policy incident_entries_all     on public.incident_entries     for all to authenticated using (true) with check (true); exception when duplicate_object then null; end $$;
do $$ begin create policy drill_entries_all        on public.drill_entries        for all to authenticated using (true) with check (true); exception when duplicate_object then null; end $$;
do $$ begin create policy toolbox_talk_entries_all on public.toolbox_talk_entries for all to authenticated using (true) with check (true); exception when duplicate_object then null; end $$;
do $$ begin create policy she_meeting_entries_all  on public.she_meeting_entries  for all to authenticated using (true) with check (true); exception when duplicate_object then null; end $$;
