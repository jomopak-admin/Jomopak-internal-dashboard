-- Phase 15 — Full data model migration
--
-- This migration creates every table and column required by the dashboard
-- features built since phase 13 / 14 and currently surviving only in
-- localStorage. After running this in the Supabase SQL editor (staging
-- first, then prod), the application layer will start round-tripping
-- those modules through Supabase the same way the original modules do.
--
-- Sections:
--   1.  ALTERs on existing tables (jobs, clients, leads, finished_goods_stock, machines)
--   2.  Cost masters (ink_rates, finishing_operations, press_rates, plate_costs)
--   3.  Invoices (incl. line items + payments via jsonb on the row)
--   4.  Production specs
--   5.  Work tickets (incl. ink / press / guillotine / finishing lines via jsonb)
--   6.  Chemical register (MSDS)
--   7.  Food-Safe material register
--   8.  Cleaning logs
--   9.  Customer complaints
--   10. Non-conformance register (NCR + CAPA)
--   11. HACCP hazard register
--   12. SOP document register
--   13. Phase 4 registers (training, PPE, pest, foreign object, tool/blade, visitor)
--
-- Conventions:
--   - `id text primary key` matches the app's auto-generated code IDs
--     (CHEM-202605-001 etc.). The app never inserts UUIDs server-side.
--   - jsonb is used for nested arrays of objects (line items, payments,
--     activities, qc plan stages, changeover checklist, acknowledgements)
--     because they're always queried with the parent and the shape is
--     defined by the application.
--   - RLS is enabled on every new table with a permissive
--     authenticated-only select/insert/update/delete policy. Tighter
--     role-scoped policies can be layered later.
--   - All ALTERs use `add column if not exists` so the file is idempotent.
--   - Tables are wrapped in `create table if not exists` for the same reason.

------------------------------------------------------------------------
-- 1. ALTERs on existing tables
------------------------------------------------------------------------

-- Jobs: food safety phase 1 + 2 fields
alter table public.jobs
  add column if not exists food_contact_level text not null default 'NonFood',
  add column if not exists food_safe_material_ids text[] not null default '{}',
  add column if not exists internal_batch_number text not null default '',
  add column if not exists food_safety_notes text not null default '',
  add column if not exists assigned_machine_id text not null default '',
  add column if not exists changeover_checklist jsonb not null default '[]'::jsonb,
  add column if not exists qc_plan jsonb not null default '[]'::jsonb;

create index if not exists jobs_assigned_machine_id_idx on public.jobs(assigned_machine_id);
create index if not exists jobs_food_contact_level_idx on public.jobs(food_contact_level);

-- Clients: customer food-safety requirements + paper-bag retention bits
alter table public.clients
  add column if not exists food_safe_declaration_required boolean not null default false,
  add column if not exists batch_number_required_on_delivery_note boolean not null default false,
  add column if not exists coa_required boolean not null default false,
  add column if not exists product_spec_required boolean not null default false,
  add column if not exists special_packing_rules text not null default '',
  add column if not exists special_delivery_rules text not null default '',
  add column if not exists approved_material_restrictions text not null default '';

-- Leads: CRM upgrades (follow-up, activities, lost reason, estimated value)
alter table public.leads
  add column if not exists next_follow_up_date text not null default '',
  add column if not exists activities jsonb not null default '[]'::jsonb,
  add column if not exists lost_reason text not null default '',
  add column if not exists estimated_value numeric(14, 2) not null default 0;

create index if not exists leads_next_follow_up_date_idx on public.leads(next_follow_up_date);
create index if not exists leads_status_idx on public.leads(status);

-- Finished goods stock: food-safety hold / release
alter table public.finished_goods_stock
  add column if not exists food_safety_hold_status text not null default 'In Production',
  add column if not exists released_by_name text not null default '',
  add column if not exists released_at timestamptz,
  add column if not exists hold_reason text not null default '';

create index if not exists finished_goods_stock_hold_status_idx
  on public.finished_goods_stock(food_safety_hold_status);

-- Machines: maintenance gate
alter table public.machines
  add column if not exists maintenance_status text not null default 'OK',
  add column if not exists last_serviced_date text not null default '',
  add column if not exists next_service_date text not null default '',
  add column if not exists open_maintenance_issue text not null default '';

-- Phase 16 (Task #72) — Materials Receiving extension. Lets one table
-- capture every kind of incoming material instead of being paper-only.
-- Both columns are nullable/defaulted so existing rows keep working.
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'material_receipts'
  ) then
    execute 'alter table public.material_receipts add column if not exists material_kind text not null default ''Paper''';
    execute 'alter table public.material_receipts add column if not exists item_name text not null default ''''';
  end if;
end$$;

------------------------------------------------------------------------
-- 2. Cost masters (ink_rates, finishing_operations, press_rates, plate_costs)
------------------------------------------------------------------------

create table if not exists public.ink_rates (
  id text primary key,
  name text not null,
  ink_type text not null default 'Process',
  supplier_id text default '',
  supplier_name text default '',
  cost_per_kg numeric(14, 4) not null default 0,
  coverage_sqm_per_kg numeric(14, 4) not null default 100,
  default_coverage_percent numeric(6, 2) not null default 30,
  notes text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
-- Idempotent column-adds for installs that ran an earlier version of this
-- file. Safe to re-run; no-op if columns already exist.
alter table public.ink_rates
  add column if not exists ink_type text not null default 'Process',
  add column if not exists coverage_sqm_per_kg numeric(14, 4) not null default 100,
  add column if not exists default_coverage_percent numeric(6, 2) not null default 30;

create table if not exists public.finishing_operations (
  id text primary key,
  name text not null,
  machine_name text not null default '',
  rate_type text not null default 'PerThousand',
  rate numeric(14, 4) not null default 0,
  setup_cost numeric(14, 2) not null default 0,
  run_speed_per_hour numeric(14, 2) not null default 0,
  notes text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.finishing_operations
  add column if not exists machine_name text not null default '',
  add column if not exists rate_type text not null default 'PerThousand',
  add column if not exists rate numeric(14, 4) not null default 0,
  add column if not exists setup_cost numeric(14, 2) not null default 0,
  add column if not exists run_speed_per_hour numeric(14, 2) not null default 0;

create table if not exists public.press_rates (
  id text primary key,
  machine_id text default '',
  machine_name text default '',
  rate_per_hour numeric(14, 2) not null default 0,
  make_ready_sheets int not null default 0,
  make_ready_minutes int not null default 0,
  run_speed_sheets_per_hour numeric(14, 2) not null default 0,
  notes text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.press_rates
  add column if not exists make_ready_sheets int not null default 0,
  add column if not exists make_ready_minutes int not null default 0,
  add column if not exists run_speed_sheets_per_hour numeric(14, 2) not null default 0;

create table if not exists public.plate_costs (
  id text primary key,
  name text not null,
  format text not null default '',
  cost_per_color numeric(14, 2) not null default 0,
  origination_cost numeric(14, 2) not null default 0,
  notes text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.plate_costs
  add column if not exists format text not null default '',
  add column if not exists cost_per_color numeric(14, 2) not null default 0,
  add column if not exists origination_cost numeric(14, 2) not null default 0;

------------------------------------------------------------------------
-- 3. Invoices (with line items + payments stored as jsonb)
------------------------------------------------------------------------

create table if not exists public.invoices (
  id text primary key,
  invoice_number text not null,
  created_at timestamptz not null default now(),
  invoice_date text not null,
  due_date text not null default '',
  client_id text default '',
  client_name text not null default '',
  client_company_name text not null default '',
  client_vat_number text not null default '',
  client_billing_address text not null default '',
  client_contact_name text not null default '',
  client_contact_email text not null default '',
  client_contact_phone text not null default '',
  job_id text default '',
  job_number text default '',
  quote_id text default '',
  quote_number text default '',
  production_spec_id text default '',
  production_spec_number text default '',
  customer_reference text not null default '',
  terms_type text not null default '50% Deposit',
  terms_text text not null default '',
  notes text not null default '',
  footer_notes text not null default '',
  status text not null default 'Draft',
  currency text not null default 'ZAR',
  line_items jsonb not null default '[]'::jsonb,
  subtotal_excl_vat numeric(14, 2) not null default 0,
  vat_total numeric(14, 2) not null default 0,
  total_incl_vat numeric(14, 2) not null default 0,
  payments jsonb not null default '[]'::jsonb,
  amount_paid numeric(14, 2) not null default 0,
  amount_outstanding numeric(14, 2) not null default 0,
  stock_holding_applies boolean not null default false,
  stock_holding_status text not null default 'Not Applicable',
  stock_holding_start_date text not null default '',
  stock_holding_max_days int not null default 0,
  client_visible boolean not null default true,
  version int not null default 1,
  updated_at timestamptz not null default now()
);

create index if not exists invoices_client_id_idx on public.invoices(client_id);
create index if not exists invoices_job_id_idx on public.invoices(job_id);
create index if not exists invoices_status_idx on public.invoices(status);
create index if not exists invoices_due_date_idx on public.invoices(due_date);

-- Reuse the phase-14 version-bump trigger now that the column is in place.
drop trigger if exists invoices_bump_version on public.invoices;
create trigger invoices_bump_version
  before update on public.invoices
  for each row execute function public.bump_row_version();

------------------------------------------------------------------------
-- 4. Production specs
------------------------------------------------------------------------

create table if not exists public.production_specs (
  id text primary key,
  spec_number text not null,
  created_at timestamptz not null default now(),
  spec_date text not null,
  status text not null default 'Draft',
  client_id text default '',
  client_name text not null default '',
  product_id text default '',
  product_name text not null default '',
  job_id text default '',
  job_number text default '',
  size_width_mm numeric(10, 2) not null default 0,
  size_height_mm numeric(10, 2) not null default 0,
  size_gusset_mm numeric(10, 2) not null default 0,
  paper_gsm numeric(10, 2) not null default 0,
  paper_type text not null default '',
  handle_type text not null default '',
  finishing_notes text not null default '',
  print_method text not null default 'Plain',
  print_colours int not null default 0,
  pantone_references text not null default '',
  artwork_reference text not null default '',
  print_position_notes text not null default '',
  quantity_ordered numeric(14, 2) not null default 0,
  quantity_unit text not null default 'units',
  lead_time_days int not null default 0,
  packing_format text not null default '',
  packing_notes text not null default '',
  approved_by text not null default '',
  approved_date text not null default '',
  notes text not null default '',
  client_visible boolean not null default true
);

create index if not exists production_specs_client_id_idx on public.production_specs(client_id);
create index if not exists production_specs_job_id_idx on public.production_specs(job_id);

------------------------------------------------------------------------
-- 5. Work tickets (nested ink / press / guillotine / finishing lines as jsonb)
------------------------------------------------------------------------

create table if not exists public.work_tickets (
  id text primary key,
  ticket_number text not null,
  created_at timestamptz not null default now(),
  ticket_date text not null,
  linked_quote_id text default '',
  linked_quote_number text default '',
  linked_job_id text default '',
  linked_job_number text default '',
  client_id text default '',
  client_name text not null default '',
  product_id text default '',
  product_name text not null default '',
  product_description text not null default '',
  size_spec text not null default '',
  handle_type text not null default 'None',
  print_method text not null default 'Plain',
  colors int not null default 0,
  quantity numeric(14, 2) not null default 0,
  sheets numeric(14, 2) not null default 0,
  sheet_size text not null default '',
  paper_rate_id text default '',
  paper_rate_name text default '',
  paper_type text not null default '',
  paper_gsm text not null default '',
  paper_kg numeric(14, 4) not null default 0,
  paper_cost numeric(14, 2) not null default 0,
  plate_cost_id text default '',
  plate_cost_name text default '',
  pre_press_cost numeric(14, 2) not null default 0,
  ink_lines jsonb not null default '[]'::jsonb,
  ink_subtotal numeric(14, 2) not null default 0,
  press_lines jsonb not null default '[]'::jsonb,
  press_subtotal numeric(14, 2) not null default 0,
  guillotine_lines jsonb not null default '[]'::jsonb,
  guillotine_subtotal numeric(14, 2) not null default 0,
  finishing_lines jsonb not null default '[]'::jsonb,
  finishing_subtotal numeric(14, 2) not null default 0,
  despatch_cost numeric(14, 2) not null default 0,
  despatch_notes text not null default '',
  total_cost numeric(14, 2) not null default 0,
  margin_percent numeric(6, 2) not null default 0,
  selling_price_per_unit numeric(14, 4) not null default 0,
  selling_price_total numeric(14, 2) not null default 0,
  status text not null default 'Draft',
  notes text not null default '',
  priced_from_masters boolean not null default true,
  version int not null default 1,
  updated_at timestamptz not null default now()
);

create index if not exists work_tickets_linked_job_id_idx on public.work_tickets(linked_job_id);
create index if not exists work_tickets_client_id_idx on public.work_tickets(client_id);

drop trigger if exists work_tickets_bump_version on public.work_tickets;
create trigger work_tickets_bump_version
  before update on public.work_tickets
  for each row execute function public.bump_row_version();

------------------------------------------------------------------------
-- 6. Chemical register (MSDS)
------------------------------------------------------------------------

create table if not exists public.chemical_register_entries (
  id text primary key,
  register_number text not null,
  created_at timestamptz not null default now(),
  chemical_name text not null,
  trade_name text not null default '',
  supplier_id text default '',
  supplier_name text not null default '',
  cas_number text not null default '',
  un_number text not null default '',
  state text not null default 'Liquid',
  ghs_pictograms text[] not null default '{}',
  hazard_statements text not null default '',
  precautionary_statements text not null default '',
  storage_location text not null default '',
  max_on_site_quantity numeric(14, 4) not null default 0,
  current_on_site_quantity numeric(14, 4) not null default 0,
  quantity_unit text not null default 'L',
  msds_document_url text not null default '',
  msds_last_reviewed_date text not null default '',
  msds_review_interval_months int not null default 12,
  emergency_procedure text not null default '',
  required_ppe text not null default '',
  fire_suppression_type text not null default '',
  notes text not null default '',
  archived boolean not null default false
);

create index if not exists chemical_register_supplier_id_idx on public.chemical_register_entries(supplier_id);
create index if not exists chemical_register_archived_idx on public.chemical_register_entries(archived);

------------------------------------------------------------------------
-- 7. Food-Safe Material Register
------------------------------------------------------------------------

create table if not exists public.food_safe_materials (
  id text primary key,
  material_number text not null,
  created_at timestamptz not null default now(),
  material_name text not null,
  category text not null default 'Paper',
  supplier_id text default '',
  supplier_name text not null default '',
  supplier_sku text not null default '',
  direct_contact_approved boolean not null default false,
  indirect_contact_approved boolean not null default false,
  external_print_only boolean not null default false,
  food_safe_declaration_url text not null default '',
  msds_url text not null default '',
  certificate_of_analysis_url text not null default '',
  supplier_batch_number text not null default '',
  internal_batch_number text not null default '',
  storage_location text not null default '',
  status text not null default 'Pending',
  approval_date text not null default '',
  review_date text not null default '',
  expiry_date text not null default '',
  notes text not null default ''
);

create index if not exists food_safe_materials_status_idx on public.food_safe_materials(status);
create index if not exists food_safe_materials_supplier_id_idx on public.food_safe_materials(supplier_id);

------------------------------------------------------------------------
-- 8. Cleaning logs
------------------------------------------------------------------------

create table if not exists public.cleaning_logs (
  id text primary key,
  log_number text not null,
  created_at timestamptz not null default now(),
  area text not null default 'Bag Machine',
  area_detail text not null default '',
  machine_id text default '',
  cleaning_type text not null default 'Pre-Shift',
  performed_at text not null,
  performed_by_name text not null default '',
  chemical_register_id text default '',
  chemical_name text not null default '',
  result text not null default 'Pass',
  supervisor_sign_off_name text not null default '',
  supervisor_sign_off_at text not null default '',
  corrective_action text not null default '',
  before_photo_url text not null default '',
  after_photo_url text not null default '',
  notes text not null default ''
);

create index if not exists cleaning_logs_machine_id_idx on public.cleaning_logs(machine_id);
create index if not exists cleaning_logs_performed_at_idx on public.cleaning_logs(performed_at);
create index if not exists cleaning_logs_result_idx on public.cleaning_logs(result);

------------------------------------------------------------------------
-- 9. Customer complaints
------------------------------------------------------------------------

create table if not exists public.customer_complaints (
  id text primary key,
  complaint_number text not null,
  created_at timestamptz not null default now(),
  complaint_date text not null,
  client_id text default '',
  client_name text not null default '',
  reported_by_name text not null default '',
  reported_by_contact text not null default '',
  product_id text default '',
  product_name text not null default '',
  finished_goods_stock_id text default '',
  finished_goods_stock_number text default '',
  job_id text default '',
  job_number text default '',
  internal_batch_number text not null default '',
  delivery_note_id text default '',
  delivery_note_number text default '',
  invoice_id text default '',
  invoice_number text default '',
  complaint_type text not null default 'Product Defect',
  severity text not null default 'Medium',
  description text not null default '',
  quantity_affected numeric(14, 4) not null default 0,
  quantity_unit text not null default 'units',
  quantity_with_customer numeric(14, 4) not null default 0,
  quantity_internal_stock numeric(14, 4) not null default 0,
  photo_urls text[] not null default '{}',
  status text not null default 'New',
  investigation_notes text not null default '',
  root_cause_analysis text not null default '',
  immediate_action text not null default '',
  corrective_action text not null default '',
  preventive_action text not null default '',
  outcome text not null default 'Pending',
  outcome_notes text not null default '',
  closed_by_name text not null default '',
  closed_at timestamptz,
  recall_triggered boolean not null default false,
  recall_scope text not null default ''
);

create index if not exists customer_complaints_client_id_idx on public.customer_complaints(client_id);
create index if not exists customer_complaints_status_idx on public.customer_complaints(status);
create index if not exists customer_complaints_recall_idx on public.customer_complaints(recall_triggered);

------------------------------------------------------------------------
-- 10. Non-Conformance Register (NCR + CAPA)
------------------------------------------------------------------------

create table if not exists public.non_conformances (
  id text primary key,
  ncr_number text not null,
  created_at timestamptz not null default now(),
  issue_date text not null,
  area text not null default 'Bag Machine',
  area_detail text not null default '',
  issue_type text not null default 'Cleaning Not Completed',
  severity text not null default 'Medium',
  description text not null default '',
  job_id text default '',
  job_number text default '',
  internal_batch_number text not null default '',
  finished_goods_stock_id text default '',
  finished_goods_stock_number text default '',
  cleaning_log_id text default '',
  reported_by_name text not null default '',
  immediate_action text not null default '',
  root_cause_analysis text not null default '',
  corrective_action text not null default '',
  preventive_action text not null default '',
  responsible_person_name text not null default '',
  due_date text not null default '',
  evidence_photo_urls text[] not null default '{}',
  status text not null default 'Open',
  verified_by_name text not null default '',
  verified_at timestamptz,
  closed_by_name text not null default '',
  closed_at timestamptz,
  closure_notes text not null default ''
);

create index if not exists non_conformances_status_idx on public.non_conformances(status);
create index if not exists non_conformances_due_date_idx on public.non_conformances(due_date);
create index if not exists non_conformances_job_id_idx on public.non_conformances(job_id);

------------------------------------------------------------------------
-- 11. HACCP hazard register
------------------------------------------------------------------------

create table if not exists public.haccp_hazards (
  id text primary key,
  hazard_number text not null,
  created_at timestamptz not null default now(),
  process_step text not null default 'Raw Material Receiving',
  hazard_type text not null default 'Physical',
  hazard_name text not null,
  description text not null default '',
  likelihood int not null default 3,
  severity int not null default 3,
  risk_level text not null default 'Medium',
  control_measure text not null default '',
  is_ccp boolean not null default false,
  monitoring_method text not null default '',
  monitoring_frequency text not null default '',
  critical_limits text not null default '',
  corrective_action text not null default '',
  verification_method text not null default '',
  responsible_person text not null default '',
  review_interval_months int not null default 12,
  last_reviewed_date text not null default '',
  notes text not null default ''
);

create index if not exists haccp_hazards_risk_level_idx on public.haccp_hazards(risk_level);
create index if not exists haccp_hazards_is_ccp_idx on public.haccp_hazards(is_ccp);

------------------------------------------------------------------------
-- 12. SOP document register (acknowledgements stored as jsonb)
------------------------------------------------------------------------

create table if not exists public.sop_documents (
  id text primary key,
  document_number text not null,
  created_at timestamptz not null default now(),
  title text not null,
  category text not null default 'Food Safety Policy',
  version text not null default '1.0',
  owner_name text not null default '',
  approved_by_name text not null default '',
  approved_date text not null default '',
  review_date text not null default '',
  document_url text not null default '',
  summary text not null default '',
  status text not null default 'Draft',
  acknowledgements jsonb not null default '[]'::jsonb,
  supersedes_id text default '',
  notes text not null default ''
);

create index if not exists sop_documents_status_idx on public.sop_documents(status);
create index if not exists sop_documents_category_idx on public.sop_documents(category);

------------------------------------------------------------------------
-- 13. Phase 4 registers (training, PPE, pest, foreign object, tool/blade, visitor)
------------------------------------------------------------------------

create table if not exists public.staff_training_records (
  id text primary key,
  record_number text not null,
  created_at timestamptz not null default now(),
  staff_name text not null,
  staff_role text not null default '',
  topic text not null default 'Food Safety',
  training_date text not null,
  trainer_name text not null default '',
  method text not null default '',
  acknowledged boolean not null default false,
  acknowledged_date text not null default '',
  refresher_interval_months int not null default 12,
  next_refresher_date text not null default '',
  certificate_url text not null default '',
  notes text not null default ''
);

create index if not exists staff_training_topic_idx on public.staff_training_records(topic);
create index if not exists staff_training_next_refresher_idx on public.staff_training_records(next_refresher_date);

create table if not exists public.ppe_issue_records (
  id text primary key,
  issue_number text not null,
  created_at timestamptz not null default now(),
  staff_name text not null,
  staff_role text not null default '',
  item_type text not null default 'Hairnet',
  item_description text not null default '',
  quantity int not null default 1,
  issued_by_name text not null default '',
  issued_date text not null,
  status text not null default 'Issued',
  return_date text not null default '',
  replacement_due_date text not null default '',
  notes text not null default ''
);

create index if not exists ppe_records_status_idx on public.ppe_issue_records(status);

create table if not exists public.pest_control_records (
  id text primary key,
  record_number text not null,
  created_at timestamptz not null default now(),
  service_date text not null,
  provider_name text not null default '',
  technician_name text not null default '',
  next_service_date text not null default '',
  activity_type text not null default 'Preventive Treatment',
  pest_type text not null default '',
  findings text not null default '',
  corrective_actions text not null default '',
  product_affected boolean not null default false,
  stock_on_hold boolean not null default false,
  report_urls text[] not null default '{}',
  bait_station_map_url text not null default '',
  notes text not null default ''
);

create index if not exists pest_records_service_date_idx on public.pest_control_records(service_date);
create index if not exists pest_records_next_service_idx on public.pest_control_records(next_service_date);

create table if not exists public.foreign_object_records (
  id text primary key,
  record_number text not null,
  created_at timestamptz not null default now(),
  area text not null default 'Bag Machine',
  material text not null default 'Glass',
  description text not null default '',
  record_type text not null default 'Risk Inventory',
  inspection_date text not null,
  inspected_by_name text not null default '',
  status text not null default 'Open',
  control_measure text not null default '',
  linked_ncr_id text default '',
  photo_urls text[] not null default '{}',
  notes text not null default ''
);

create index if not exists foreign_object_status_idx on public.foreign_object_records(status);

create table if not exists public.tool_blade_records (
  id text primary key,
  record_number text not null,
  created_at timestamptz not null default now(),
  item_type text not null default 'Blade',
  serial_number text not null,
  description text not null default '',
  home_location text not null default '',
  current_holder_name text not null default '',
  issued_to_name text not null default '',
  issued_date text not null default '',
  expected_return_date text not null default '',
  returned_date text not null default '',
  status text not null default 'Available',
  is_critical boolean not null default true,
  linked_ncr_id text default '',
  notes text not null default ''
);

create index if not exists tool_blade_status_idx on public.tool_blade_records(status);
create index if not exists tool_blade_is_critical_idx on public.tool_blade_records(is_critical);

create table if not exists public.visitor_log_entries (
  id text primary key,
  visit_number text not null,
  created_at timestamptz not null default now(),
  visit_date text not null,
  visitor_name text not null,
  visitor_type text not null default 'Contractor',
  company text not null default '',
  host_name text not null default '',
  purpose text not null default '',
  areas_visited text[] not null default '{}',
  time_in text not null default '',
  time_out text not null default '',
  hygiene_acknowledged boolean not null default false,
  ppe_issued text not null default '',
  entered_food_contact_area boolean not null default false,
  notes text not null default ''
);

create index if not exists visitor_log_date_idx on public.visitor_log_entries(visit_date);

------------------------------------------------------------------------
-- 14. RLS policies (idempotent — runs against every new table in one go)
------------------------------------------------------------------------

do $$
declare
  t text;
  new_tables text[] := array[
    'ink_rates', 'finishing_operations', 'press_rates', 'plate_costs',
    'invoices', 'production_specs', 'work_tickets',
    'chemical_register_entries', 'food_safe_materials', 'cleaning_logs',
    'customer_complaints', 'non_conformances', 'haccp_hazards', 'sop_documents',
    'staff_training_records', 'ppe_issue_records', 'pest_control_records',
    'foreign_object_records', 'tool_blade_records', 'visitor_log_entries'
  ];
begin
  foreach t in array new_tables loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists %I on public.%I', t || '_select', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (true)',
      t || '_select', t
    );

    execute format('drop policy if exists %I on public.%I', t || '_insert', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (true)',
      t || '_insert', t
    );

    execute format('drop policy if exists %I on public.%I', t || '_update', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using (true) with check (true)',
      t || '_update', t
    );

    execute format('drop policy if exists %I on public.%I', t || '_delete', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (true)',
      t || '_delete', t
    );
  end loop;
end$$;

-- ------------------------------------------------------------------
-- Done.
-- ------------------------------------------------------------------
-- After running this:
--   1. Verify in the Supabase Table Editor that every table listed in
--      section 14's array now exists with the right columns.
--   2. Verify ALTERed tables (jobs / clients / leads / finished_goods_stock /
--      machines) show the new columns at the bottom.
--   3. Re-deploy the dashboard so the updated supabaseData.ts can begin
--      reading + writing to these tables.
