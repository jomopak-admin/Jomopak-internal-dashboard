-- Phase 120 — Pro-forma invoices.
--
-- A pro-forma is the SARS-aligned "request for payment" document raised
-- before a tax invoice. No output VAT triggers on a pro-forma. When the
-- customer pays, an admin clicks "Generate Tax Invoice for R X" on the
-- pro-forma and a real Invoice row is created with proforma_id set —
-- that's where output VAT triggers.
--
-- Pro-formas spawn one or more Tax Invoices (50/50 customers get two,
-- prepay customers get one). The pro-forma keeps a running tally:
--   amount_invoiced       — sum(linked tax invoices' totalInclVat)
--   amount_still_to_invoice — totalInclVat - amount_invoiced
--   status                — Draft / Sent / PartiallyPaid / FullyPaid / Cancelled
--
-- The link from Invoice -> ProForma is captured as proforma_id on the
-- existing invoices table. The reverse (ProForma -> Invoices) lives in
-- the linked_invoice_ids jsonb array, updated on each tax-invoice save.
--
-- Idempotent: safe to run more than once.

create table if not exists public.pro_formas (
  id text primary key,
  proforma_number text not null,
  version integer default 1,
  updated_at timestamptz default now(),
  proforma_date date not null,
  valid_until_date date,
  -- Client snapshot (frozen at save so the doc doesn't drift if the
  -- client record is later edited)
  client_id text,
  client_name text,
  client_company_name text,
  client_vat_number text,
  client_billing_address text,
  client_contact_name text,
  client_contact_email text,
  client_contact_phone text,
  -- Upstream links
  job_id text,
  job_number text,
  quote_id text,
  quote_number text,
  customer_reference text,
  -- Body
  terms_type text,
  terms_text text,
  notes text,
  footer_notes text,
  customer_note text,
  status text not null default 'Draft',
  currency text default 'ZAR',
  exchange_rate numeric default 1,
  payment_expectation text,
  client_visible boolean default true,
  -- Line items + totals stored as jsonb (same shape as invoices.line_items)
  line_items jsonb default '[]'::jsonb,
  subtotal_excl_vat numeric default 0,
  vat_total numeric default 0,
  total_incl_vat numeric default 0,
  -- Conversion tracking — populated as Tax Invoices are raised against
  -- this pro-forma. amount_still_to_invoice is what drives the "Generate
  -- Tax Invoice for R X" prompt on the page.
  linked_invoice_ids jsonb default '[]'::jsonb,
  amount_invoiced numeric default 0,
  amount_still_to_invoice numeric default 0,
  amount_received_not_yet_invoiced numeric default 0,
  created_at timestamptz default now()
);

create index if not exists pro_formas_client_id_idx on public.pro_formas (client_id);
create index if not exists pro_formas_status_idx on public.pro_formas (status);
create index if not exists pro_formas_proforma_date_idx on public.pro_formas (proforma_date);

-- Phase 120 — Tax Invoice → Pro-forma link. Optional column so legacy
-- invoices (created before this module existed) stay valid.
alter table public.invoices
  add column if not exists proforma_id text,
  add column if not exists proforma_number text;

create index if not exists invoices_proforma_id_idx on public.invoices (proforma_id);

comment on table public.pro_formas is
  'Phase 120. Pro-forma invoices — request for payment, no VAT trigger. '
  'A pro-forma spawns Tax Invoices as payments arrive; the linked_invoice_ids '
  'array tracks the children.';

comment on column public.invoices.proforma_id is
  'Phase 120. When a Tax Invoice was raised from a pro-forma payment, '
  'this points back. Null for legacy direct invoices.';

-- RLS — same authenticated-only pattern as invoices/quotes.
alter table public.pro_formas enable row level security;

drop policy if exists "pro_formas_select" on public.pro_formas;
create policy "pro_formas_select" on public.pro_formas
  for select to authenticated using (true);

drop policy if exists "pro_formas_insert" on public.pro_formas;
create policy "pro_formas_insert" on public.pro_formas
  for insert to authenticated with check (true);

drop policy if exists "pro_formas_update" on public.pro_formas;
create policy "pro_formas_update" on public.pro_formas
  for update to authenticated using (true) with check (true);

drop policy if exists "pro_formas_delete" on public.pro_formas;
create policy "pro_formas_delete" on public.pro_formas
  for delete to authenticated using (true);
