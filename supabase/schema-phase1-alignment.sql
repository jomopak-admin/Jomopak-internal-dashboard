create extension if not exists pgcrypto;

alter table public.profiles
add column if not exists dashboard_widgets jsonb default '[]'::jsonb,
add column if not exists client_id text,
add column if not exists username text,
add column if not exists phone_number text,
add column if not exists account_type text default 'internal',
add column if not exists public_display_name text,
add column if not exists public_display_role text;

create unique index if not exists profiles_username_unique_idx
on public.profiles (lower(username))
where username is not null and username <> '';

create table if not exists public.leads (
  id text primary key,
  lead_number text not null,
  created_at timestamptz default now(),
  enquiry_date date,
  client_id text,
  client_name text,
  company_name text,
  contact_name text,
  phone text,
  email text,
  source text,
  assigned_to text,
  product_id text,
  product_name text,
  requested_quantity numeric default 0,
  due_date date,
  status text,
  quickbooks_estimate_number text,
  linked_quote_id text,
  linked_quote_number text,
  notes text
);

alter table public.quote_estimates
add column if not exists quickbooks_estimate_number text,
add column if not exists linked_lead_id text,
add column if not exists linked_lead_number text,
add column if not exists sales_owner_name text;

alter table public.jobs
add column if not exists lead_id text,
add column if not exists lead_number text,
add column if not exists quote_id text,
add column if not exists quote_number_ref text,
add column if not exists quickbooks_estimate_number text,
add column if not exists invoice_number text,
add column if not exists sales_owner_name text,
add column if not exists order_value numeric default 0,
add column if not exists payment_requirement text default '50% Deposit',
add column if not exists payment_status text default 'Pending',
add column if not exists credit_check_status text default 'Not Required',
add column if not exists available_credit_at_approval numeric default 0,
add column if not exists commercial_release_status text default 'Pending',
add column if not exists product_category text default 'Paper Bags',
add column if not exists paper_quantity_required numeric default 0,
add column if not exists paper_quantity_unit text default 'kg',
add column if not exists paper_allocation_status text default 'Not Checked',
add column if not exists linked_material_order_id text,
add column if not exists print_required boolean default false,
add column if not exists color_count integer default 0,
add column if not exists supply_format text default 'Boxes',
add column if not exists packing_notes text,
add column if not exists print_notes text,
add column if not exists captured_by text,
add column if not exists released_by text,
add column if not exists artwork_preparation_status text default 'Needs Design',
add column if not exists add_elements_required boolean default false,
add column if not exists color_changes_required boolean default false,
add column if not exists artwork_change_summary text,
add column if not exists artwork_assigned_date date,
add column if not exists artwork_assigned_to text,
add column if not exists proof_shared_date date,
add column if not exists proof_shared_by text,
add column if not exists final_approval_received_date date,
add column if not exists final_approval_cleared_by text,
add column if not exists factory_release_date date,
add column if not exists factory_released_by text,
add column if not exists production_start_date date,
add column if not exists production_started_by text,
add column if not exists ready_for_dispatch_date date,
add column if not exists ready_for_dispatch_by text,
add column if not exists collection_or_delivery_status text default 'Not Confirmed';

create table if not exists public.stock_change_logs (
  id text primary key,
  created_at timestamptz default now(),
  finished_goods_stock_id text,
  stock_number text,
  product_name text,
  action text,
  changed_by_user_id text,
  changed_by_name text,
  previous_quantity_on_hand numeric default 0,
  next_quantity_on_hand numeric default 0,
  previous_quantity_reserved numeric default 0,
  next_quantity_reserved numeric default 0,
  notes text
);

create table if not exists public.material_order_requests (
  id text primary key,
  order_number text not null,
  created_at timestamptz default now(),
  requested_date date,
  status text,
  job_id text,
  job_number text,
  client_id text,
  client_name text,
  product_id text,
  product_name text,
  paper_type text,
  gsm text,
  quantity_required numeric default 0,
  quantity_unit text,
  shortage_quantity numeric default 0,
  supplier_id text,
  supplier_name text,
  requested_by text,
  notes text
);

alter table public.finished_goods_stock
add column if not exists barcode text,
add column if not exists quantity_available numeric default 0;

alter table public.spare_parts
add column if not exists barcode text;

alter table public.material_receipts
add column if not exists barcode text,
add column if not exists quantity_available numeric default 0;

update public.finished_goods_stock
set
  barcode = coalesce(nullif(barcode, ''), stock_number),
  quantity_available = coalesce(quantity_available, quantity_on_hand, 0)
where barcode is null
   or barcode = ''
   or quantity_available is null;

update public.spare_parts
set barcode = coalesce(nullif(barcode, ''), part_code)
where barcode is null or barcode = '';

update public.material_receipts
set
  barcode = coalesce(nullif(barcode, ''), nullif(internal_roll_code, ''), receipt_number),
  quantity_available = coalesce(quantity_available, quantity_received, 0)
where barcode is null
   or barcode = ''
   or quantity_available is null;

create table if not exists public.inventory_movements (
  id text primary key,
  movement_number text not null,
  created_at timestamptz default now(),
  movement_date date not null,
  item_type text not null,
  movement_type text not null,
  barcode text,
  item_id text,
  item_code text,
  item_name text,
  quantity_moved numeric default 0,
  quantity_unit text,
  from_location text,
  to_location text,
  job_id text,
  job_number text,
  moved_by_user_id text,
  moved_by_name text,
  notes text
);

create index if not exists inventory_movements_barcode_idx
on public.inventory_movements (barcode);

create index if not exists inventory_movements_item_id_idx
on public.inventory_movements (item_id);

create index if not exists inventory_movements_job_id_idx
on public.inventory_movements (job_id);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('direct', 'group', 'announcement', 'job')),
  title text,
  description text,
  created_by_user_id uuid references public.profiles(id) on delete set null,
  visibility_scope text default 'internal',
  linked_job_id text,
  linked_client_id text,
  created_by_full_name text,
  archived_at timestamptz,
  archived_by_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_participants (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  full_name text not null,
  role text,
  last_read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_user_id uuid references public.profiles(id) on delete cascade,
  sender_full_name text not null,
  sender_role text,
  visibility_scope text default 'internal',
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  file_name text not null,
  file_url text,
  file_type text,
  storage_path text,
  public_url text,
  mime_type text,
  visibility_scope text default 'internal',
  uploaded_at timestamptz not null default now()
);

alter table public.message_attachments
add column if not exists storage_path text,
add column if not exists public_url text,
add column if not exists mime_type text,
add column if not exists attachment_kind text default 'general',
add column if not exists linked_job_id text;

update public.conversation_participants cp
set user_id = p.id
from public.profiles p
where cp.user_id is null
  and lower(cp.full_name) = lower(p.full_name);

update public.messages m
set sender_user_id = p.id
from public.profiles p
where m.sender_user_id is null
  and lower(m.sender_full_name) = lower(p.full_name);

create unique index if not exists conversation_participants_conversation_user_unique_idx
on public.conversation_participants (conversation_id, user_id)
where user_id is not null;

create index if not exists conversation_participants_name_idx
on public.conversation_participants (full_name);

create index if not exists conversation_participants_user_idx
on public.conversation_participants (user_id);

create index if not exists conversation_participants_conversation_idx
on public.conversation_participants (conversation_id);

create index if not exists conversations_type_idx
on public.conversations (type);

create index if not exists conversations_linked_job_idx
on public.conversations (linked_job_id);

create index if not exists conversations_archived_at_idx
on public.conversations (archived_at);

create index if not exists messages_conversation_idx
on public.messages (conversation_id, created_at desc);

create index if not exists message_attachments_message_idx
on public.message_attachments (message_id);
