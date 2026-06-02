-- Phase 119.3+ — Customer deposit ledger.
--
-- A deposit is money received from a customer BEFORE we issue a Tax
-- Invoice. On the balance sheet it sits as a liability — we owe the
-- customer stock (or a refund). When a Tax Invoice is later raised from
-- the parent pro-forma, the allocation engine consumes deposits FIFO
-- and reclassifies the credit as revenue.
--
-- This migration creates the deposit table and its allocation children.
-- Allocations live inside the deposit row as a jsonb array because:
--   - Each allocation is small and only ever read in the context of its
--     parent deposit (no cross-deposit queries needed).
--   - Keeping them in jsonb avoids a join table for tracking that the
--     app layer was already managing as an in-memory array.
--
-- The "linkage" — which Tax Invoice consumed which deposit — is also
-- visible from the invoice side via the existing Invoice.payments[]
-- jsonb, where the auto-allocated payment carries the deposit number
-- as its reference. That gives finance two angles: per-deposit (here)
-- and per-invoice (the payments column on invoices).
--
-- Idempotent: safe to run more than once.

create table if not exists public.customer_deposits (
  id text primary key,
  deposit_number text not null,
  version integer default 1,
  updated_at timestamptz default now(),
  -- Who paid
  client_id text,
  client_name text,
  -- When and how much
  received_date date not null,
  amount numeric not null,
  currency text default 'ZAR',
  payment_method text,
  bank_reference text,
  -- Issued back to them
  proforma_id text,
  proforma_number text,
  receipt_number text,
  -- Optional earmarking to a specific job/quote so finance can trace
  job_id text,
  job_number text,
  quote_id text,
  quote_number text,
  purpose text,
  -- Allocation tracking (jsonb because we only ever read in deposit context)
  allocations jsonb default '[]'::jsonb,
  allocated_amount numeric default 0,
  remaining_amount numeric default 0,
  status text not null default 'Open',
  -- Audit
  captured_by_name text,
  captured_at timestamptz default now(),
  notes text,
  created_at timestamptz default now()
);

create index if not exists customer_deposits_client_id_idx on public.customer_deposits (client_id);
create index if not exists customer_deposits_proforma_id_idx on public.customer_deposits (proforma_id);
create index if not exists customer_deposits_status_idx on public.customer_deposits (status);
create index if not exists customer_deposits_received_date_idx on public.customer_deposits (received_date);

comment on table public.customer_deposits is
  'Phase 119. Money received from customers before goods/Tax Invoice. '
  'Sits as a liability until allocated to a Tax Invoice via the FIFO '
  'allocation engine (handleSaveInvoice in App.tsx).';

comment on column public.customer_deposits.allocations is
  'jsonb array of DepositAllocation entries: one per Tax Invoice this '
  'deposit was drawn against. Includes id, invoiceId, invoiceNumber, '
  'appliedAmount, appliedAt, appliedByName, reason, isReversal, notes.';

-- RLS — same authenticated-only pattern as invoices/pro_formas.
alter table public.customer_deposits enable row level security;

drop policy if exists "customer_deposits_select" on public.customer_deposits;
create policy "customer_deposits_select" on public.customer_deposits
  for select to authenticated using (true);

drop policy if exists "customer_deposits_insert" on public.customer_deposits;
create policy "customer_deposits_insert" on public.customer_deposits
  for insert to authenticated with check (true);

drop policy if exists "customer_deposits_update" on public.customer_deposits;
create policy "customer_deposits_update" on public.customer_deposits
  for update to authenticated using (true) with check (true);

drop policy if exists "customer_deposits_delete" on public.customer_deposits;
create policy "customer_deposits_delete" on public.customer_deposits
  for delete to authenticated using (true);
