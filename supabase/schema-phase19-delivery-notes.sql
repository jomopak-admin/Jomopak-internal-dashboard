-- Phase 19 — Create the missing delivery_notes table
--
-- The app queries public.delivery_notes but it was never created in this
-- Supabase project (PostgREST returned PGRST205 "Could not find the table
-- 'public.delivery_notes' in the schema cache"). This creates it to match
-- the shape the client reads/writes, with RLS + the standard authenticated
-- policies, then asks PostgREST to reload its schema cache.
--
-- Idempotent — safe to re-run.

create table if not exists public.delivery_notes (
  id text primary key,
  delivery_note_number text not null,
  created_at timestamptz not null default now(),
  note_date text not null default '',
  client_id text default '',
  client_name text not null default '',
  client_contact_name text not null default '',
  client_contact_phone text not null default '',
  client_email text not null default '',
  client_address text not null default '',
  company_name text not null default '',
  company_phone text not null default '',
  company_email text not null default '',
  company_address text not null default '',
  job_id text default '',
  job_number text not null default '',
  dispatch_record_ids text[] not null default '{}',
  customer_stock_release_ids text[] not null default '{}',
  delivery_method text not null default '',
  delivery_reference text not null default '',
  vehicle_registration text not null default '',
  driver_name text not null default '',
  dispatched_by text not null default '',
  received_by text not null default '',
  status text not null default 'Draft',
  client_visible boolean not null default true,
  line_items jsonb not null default '[]'::jsonb,
  notes text not null default ''
);

create index if not exists delivery_notes_client_id_idx on public.delivery_notes(client_id);
create index if not exists delivery_notes_job_id_idx on public.delivery_notes(job_id);
create index if not exists delivery_notes_status_idx on public.delivery_notes(status);

alter table public.delivery_notes enable row level security;

drop policy if exists delivery_notes_select on public.delivery_notes;
create policy delivery_notes_select on public.delivery_notes
  for select to authenticated using (true);

drop policy if exists delivery_notes_insert on public.delivery_notes;
create policy delivery_notes_insert on public.delivery_notes
  for insert to authenticated with check (true);

drop policy if exists delivery_notes_update on public.delivery_notes;
create policy delivery_notes_update on public.delivery_notes
  for update to authenticated using (true) with check (true);

drop policy if exists delivery_notes_delete on public.delivery_notes;
create policy delivery_notes_delete on public.delivery_notes
  for delete to authenticated using (true);

-- Tell PostgREST to refresh its schema cache so the new table is visible
-- immediately (otherwise the 404 can linger for a minute).
notify pgrst, 'reload schema';
