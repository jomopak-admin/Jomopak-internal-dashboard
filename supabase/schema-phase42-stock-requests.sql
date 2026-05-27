-- Phase 42 — Stock requests (purchase request workflow)
--
-- Floor staff submits → manager approves → buyer issues from stock OR
-- raises a PO. spare_part_id links to spare_parts for auto-deduction
-- when "issued from stock". supplier_id links to suppliers when a PO
-- is raised.
--
-- Idempotent — safe to re-run.

create table if not exists public.stock_requests (
  id                    text        primary key,
  request_number        text        not null,
  created_at            timestamptz not null default now(),
  requested_by_name     text,
  requested_for         text,
  item_name             text        not null,
  spare_part_id         text,
  spare_part_name       text,
  quantity              numeric     not null default 1,
  unit                  text,
  needed_by_date        date,
  reason                text,
  urgency               text        not null default 'Normal',
  status                text        not null default 'Pending Manager',
  approved_by_name      text,
  approved_at           timestamptz,
  approval_notes        text,
  fulfilled_by_name     text,
  fulfilled_at          timestamptz,
  fulfilment_notes      text,
  supplier_id           text,
  supplier_name         text,
  estimated_unit_cost   numeric     not null default 0,
  received_at           timestamptz
);

create index if not exists stock_requests_status_idx     on public.stock_requests (status);
create index if not exists stock_requests_requester_idx  on public.stock_requests (requested_by_name);
create index if not exists stock_requests_created_at_idx on public.stock_requests (created_at desc);

alter table public.stock_requests enable row level security;

-- Any authenticated user can read (so requesters see their own + the
-- buyer sees the queue). Writes are gated by capability permissions in
-- the app UI (stockRequests / stockRequestsApprove / stockRequestsBuy).
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'stock_requests' and policyname = 'stock_requests_select'
  ) then
    create policy stock_requests_select on public.stock_requests for select using (auth.role() = 'authenticated');
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'stock_requests' and policyname = 'stock_requests_write'
  ) then
    create policy stock_requests_write on public.stock_requests for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;
end $$;

notify pgrst, 'reload schema';
