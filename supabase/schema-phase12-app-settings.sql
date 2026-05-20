-- Phase 12 — App settings (singleton row) + branding storage bucket.
-- This table stores the editable letterhead, footer copy, and stock-holding
-- defaults that drive every printable Invoice / Delivery Note / Production Spec.
-- Only admins should hold update rights; everyone authenticated may read so
-- that printables can render the latest letterhead.

create table if not exists public.app_settings (
  id text primary key default 'default',
  company_name text not null default 'JomoPak',
  legal_name text not null default 'SAVA ONLINE T/A JomoPak Pty Ltd',
  address_line_1 text not null default '52A 4th Street Brentwood Park',
  address_line_2 text not null default 'Benoni, Gauteng 1501',
  phone text not null default '+27663049951',
  email text not null default 'aman@jomopak.co.za',
  vat_number text not null default '4930295326',
  logo_url text,
  invoice_footer_lines text[] not null default array[
    '50% deposit to be made to secure your stock and balance of payment upon receipt of full order.',
    'Please send POP when payment is made.',
    'Limited Stock available.'
  ]::text[],
  delivery_note_footer_lines text[] not null default array[
    'Please inspect goods on receipt and report any damage within 24 hours.',
    'Stock-holding releases are tracked against the parent invoice number above.'
  ]::text[],
  production_spec_footer_lines text[] not null default array[
    'Specs are confidential and intended only for internal production handover.'
  ]::text[],
  default_payment_terms text not null default '50% deposit, balance on collection.',
  default_invoice_notes text default '',
  default_delivery_note_notes text default '',
  default_stock_holding_max_days integer not null default 90,
  default_stock_holding_review_cadence_days integer not null default 30,
  default_stock_holding_terms text default
    'Stock will be held free of charge for the agreed storage period from the invoice date. Releases are subject to written instruction from an authorised contact at the client.',
  updated_at timestamptz not null default now(),
  updated_by text default ''
);

-- Singleton row guarantee: there is one and only one settings row, keyed
-- 'default'. All upserts target id = 'default'.
insert into public.app_settings (id) values ('default')
on conflict (id) do nothing;

-- RLS: read open to authenticated users (printables need the company copy);
-- write restricted to admin profiles. Adjust the predicate if you'd like
-- accounts to update too.
alter table public.app_settings enable row level security;

drop policy if exists app_settings_select on public.app_settings;
create policy app_settings_select on public.app_settings
  for select using (auth.role() = 'authenticated');

drop policy if exists app_settings_update on public.app_settings;
create policy app_settings_update on public.app_settings
  for update using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

drop policy if exists app_settings_insert on public.app_settings;
create policy app_settings_insert on public.app_settings
  for insert with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Branding bucket for the logo file. Public so the printable doc can reference
-- the URL directly without signed-URL juggling.
insert into storage.buckets (id, name, public)
  values ('branding', 'branding', true)
on conflict (id) do nothing;

-- Storage policy: anyone authenticated can read; only admins can upload/replace.
drop policy if exists branding_read on storage.objects;
create policy branding_read on storage.objects
  for select using (bucket_id = 'branding');

drop policy if exists branding_write on storage.objects;
create policy branding_write on storage.objects
  for insert with check (
    bucket_id = 'branding' and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

drop policy if exists branding_update on storage.objects;
create policy branding_update on storage.objects
  for update using (
    bucket_id = 'branding' and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

drop policy if exists branding_delete on storage.objects;
create policy branding_delete on storage.objects
  for delete using (
    bucket_id = 'branding' and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
