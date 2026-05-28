-- Phase 82: First Aid Register.
--
-- OHS Act § 14 requires the register; the Compensation Fund / RMA needs
-- the source incident record for any IOD claim; BRC/HACCP auditors check
-- it because injuries in food-handling areas are a contamination event.
--
-- Two tables:
--   • first_aid_entries — every first-aid event logged on site
--   • first_aid_aiders  — the designated first aiders register (with
--                          cert level + expiry so we can remind HR
--                          before someone's L1/L2/L3 lapses)
--
-- The client renders both with RLS-style authenticated read/write; no
-- joins required for the page itself.
--
-- Idempotent: safe to run more than once.

create table if not exists public.first_aid_entries (
  id text primary key,
  entry_number text not null,
  created_at timestamptz default now(),
  incident_date date,
  incident_time text default '',
  location text default '',
  is_visitor boolean default false,
  employee_id text default '',
  employee_name text default '',
  visitor_name text default '',
  visitor_company text default '',
  injury_type text default 'Other',
  body_part text default '',
  description text default '',
  treatment_given text default '',
  treated_by_name text default '',
  treated_by_cert_number text default '',
  is_iod boolean default false,
  iod_report_number text default '',
  iod_reported_date date,
  follow_up_required boolean default false,
  follow_up_notes text default '',
  resolved_date date,
  witness_name text default '',
  photo_urls jsonb default '[]'::jsonb,
  signature_data_url text default '',
  notes text default ''
);

create index if not exists first_aid_entries_incident_date_idx
  on public.first_aid_entries (incident_date desc);
create index if not exists first_aid_entries_employee_idx
  on public.first_aid_entries (employee_id)
  where employee_id <> '';
create index if not exists first_aid_entries_iod_idx
  on public.first_aid_entries (is_iod)
  where is_iod = true;

create table if not exists public.first_aid_aiders (
  id text primary key,
  employee_id text default '',
  full_name text not null,
  cert_level text default 'L1',
  cert_number text default '',
  cert_issued_date date,
  cert_expiry_date date,
  phone_number text default '',
  notes text default '',
  active boolean default true
);

create index if not exists first_aid_aiders_expiry_idx
  on public.first_aid_aiders (cert_expiry_date)
  where active = true;

alter table public.first_aid_entries enable row level security;
alter table public.first_aid_aiders  enable row level security;

do $$ begin
  perform 1;
  create policy if not exists first_aid_entries_select on public.first_aid_entries
    for select to authenticated using (true);
  create policy if not exists first_aid_entries_write on public.first_aid_entries
    for all to authenticated using (true) with check (true);
  create policy if not exists first_aid_aiders_select on public.first_aid_aiders
    for select to authenticated using (true);
  create policy if not exists first_aid_aiders_write on public.first_aid_aiders
    for all to authenticated using (true) with check (true);
exception when others then null;
end $$;
