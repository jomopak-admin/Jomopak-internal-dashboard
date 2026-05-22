-- Phase 23 — Imports / Shipments tracker
--
-- Inbound shipments from overseas + local suppliers, with landed cost and
-- a "receive into stock" action (creates material receipts in the app).
-- Idempotent — safe to re-run.

create table if not exists public.shipments (
  id text primary key,
  shipment_number text not null,
  created_at timestamptz not null default now(),
  supplier_id text default '',
  supplier_name text not null default '',
  reference text not null default '',
  status text not null default 'Ordered',
  incoterm text not null default 'FOB',
  currency text not null default 'USD',
  order_date text not null default '',
  expected_arrival_date text not null default '',
  actual_arrival_date text not null default '',
  container_number text not null default '',
  bill_of_lading_number text not null default '',
  vessel text not null default '',
  line_items jsonb not null default '[]'::jsonb,
  goods_value numeric(16, 2) not null default 0,
  freight_cost numeric(16, 2) not null default 0,
  duty_cost numeric(16, 2) not null default 0,
  clearing_cost numeric(16, 2) not null default 0,
  other_cost numeric(16, 2) not null default 0,
  landed_cost_total numeric(16, 2) not null default 0,
  notes text not null default '',
  received_into_stock boolean not null default false
);

create index if not exists shipments_supplier_idx on public.shipments(supplier_id);
create index if not exists shipments_status_idx on public.shipments(status);
create index if not exists shipments_eta_idx on public.shipments(expected_arrival_date);

alter table public.shipments enable row level security;

drop policy if exists shipments_select on public.shipments;
create policy shipments_select on public.shipments for select to authenticated using (true);
drop policy if exists shipments_insert on public.shipments;
create policy shipments_insert on public.shipments for insert to authenticated with check (true);
drop policy if exists shipments_update on public.shipments;
create policy shipments_update on public.shipments for update to authenticated using (true) with check (true);
drop policy if exists shipments_delete on public.shipments;
create policy shipments_delete on public.shipments for delete to authenticated using (true);

notify pgrst, 'reload schema';
