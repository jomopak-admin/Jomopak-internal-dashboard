-- Phase 20 — Reconcile core table columns with the app's data model
--
-- The app's upserts include columns that these base tables were missing
-- (PGRST204 "Could not find the 'X' column ... in the schema cache").
-- This adds every column the client writes, idempotently. Existing
-- columns are left untouched; only genuinely missing ones are added.
--
-- Tables covered: products, suppliers, machines, material_receipts.
-- Safe to re-run.

------------------------------------------------------------------------
-- products
------------------------------------------------------------------------
alter table public.products
  add column if not exists name text not null default '',
  add column if not exists sku text default '',
  add column if not exists category text not null default '',
  add column if not exists supply_type text not null default '',
  add column if not exists default_supplier_id text default '',
  add column if not exists default_supplier_name text default '',
  add column if not exists branding_allowed boolean not null default false,
  add column if not exists default_unit text not null default 'units',
  add column if not exists default_paper_type text default '',
  add column if not exists default_gsm text default '',
  add column if not exists notes text default '',
  add column if not exists active boolean not null default true;

------------------------------------------------------------------------
-- suppliers
------------------------------------------------------------------------
alter table public.suppliers
  add column if not exists name text not null default '',
  add column if not exists contact_person text default '',
  add column if not exists phone text default '',
  add column if not exists email text default '',
  add column if not exists contacts jsonb not null default '[]'::jsonb,
  add column if not exists address text default '',
  add column if not exists billing_address text default '',
  add column if not exists city text default '',
  add column if not exists country text default '',
  add column if not exists website text default '',
  add column if not exists supplier_type text not null default 'General',
  add column if not exists certificate_code text default '',
  add column if not exists account_number text default '',
  add column if not exists payment_terms text default '',
  add column if not exists credit_limit numeric(14, 2) not null default 0,
  add column if not exists current_balance numeric(14, 2) not null default 0,
  add column if not exists currency text not null default 'ZAR',
  add column if not exists is_also_client boolean not null default false,
  add column if not exists linked_client_id text default '',
  add column if not exists linked_client_name text default '',
  add column if not exists last_check_in_date text default '',
  add column if not exists next_review_date text default '',
  add column if not exists review_frequency_months int not null default 12,
  add column if not exists internal_owner text default '',
  add column if not exists certifications jsonb not null default '[]'::jsonb,
  add column if not exists supplied_products jsonb not null default '[]'::jsonb,
  add column if not exists notes text default '',
  add column if not exists active boolean not null default true;

------------------------------------------------------------------------
-- machines
------------------------------------------------------------------------
alter table public.machines
  add column if not exists name text not null default '',
  add column if not exists code text default '',
  add column if not exists department text default '',
  add column if not exists process_type text default '',
  add column if not exists status text not null default 'Operational',
  add column if not exists notes text default '',
  add column if not exists active boolean not null default true,
  add column if not exists maintenance_status text not null default 'OK',
  add column if not exists last_serviced_date text default '',
  add column if not exists next_service_date text default '',
  add column if not exists open_maintenance_issue text not null default '';

------------------------------------------------------------------------
-- material_receipts
------------------------------------------------------------------------
alter table public.material_receipts
  add column if not exists receipt_number text not null default '',
  add column if not exists barcode text default '',
  add column if not exists received_date text not null default '',
  add column if not exists supplier_id text default '',
  add column if not exists supplier_name text not null default '',
  add column if not exists supplier_batch_number text default '',
  add column if not exists internal_roll_code text not null default '',
  add column if not exists material_kind text not null default 'Paper',
  add column if not exists item_name text default '',
  add column if not exists paper_type text default '',
  add column if not exists gsm text default '',
  add column if not exists width text default '',
  add column if not exists quantity_received numeric(14, 4) not null default 0,
  add column if not exists quantity_available numeric(14, 4) not null default 0,
  add column if not exists quantity_unit text not null default 'kg',
  add column if not exists fsc_claim_type text not null default 'None',
  add column if not exists supplier_certificate_code text default '',
  add column if not exists invoice_reference text default '',
  add column if not exists storage_location text default '',
  add column if not exists inspection_notes text default '',
  add column if not exists fsc_related boolean not null default false;

-- Reload PostgREST schema cache so the new columns are visible immediately.
notify pgrst, 'reload schema';
