-- Phase 93 — Traded Goods.
--
-- Items JomoPak buys finished from third-party suppliers (Shereno Printers,
-- contract printers in China / India, etc.) and resells. Two tables:
--   traded_goods_items     = catalogue (master record per SKU).
--   traded_goods_receipts  = purchase batches with landed cost + sell price.
--
-- Cost basis is pinned at receive time so margin reporting stays accurate
-- even if the catalogue price changes later. Inventory rolls up by
-- sum(quantity_available) per item.

-- ════════════════════════════════════════════════════════════════════════
-- Catalogue
-- ════════════════════════════════════════════════════════════════════════
create table if not exists public.traded_goods_items (
  id                       text primary key,
  item_code                text not null,
  name                     text not null,
  description              text not null default '',
  default_supplier_id      text,
  default_supplier_name    text,
  size_spec                text,
  default_unit_cost        numeric(12,4) not null default 0,
  default_markup_percent   numeric(6,2)  not null default 0,
  default_sell_price       numeric(12,4),
  unit_label               text not null default 'unit',
  active                   boolean not null default true,
  notes                    text not null default '',
  photo_urls               jsonb not null default '[]'::jsonb,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists traded_goods_items_supplier_idx
  on public.traded_goods_items (default_supplier_id);

comment on table public.traded_goods_items is
  'Phase 93. Catalogue of bought-in finished goods that JomoPak resells. Default cost + markup live here; per-batch receipts pin them at receive time.';

-- ════════════════════════════════════════════════════════════════════════
-- Receipts (purchase batches)
-- ════════════════════════════════════════════════════════════════════════
create table if not exists public.traded_goods_receipts (
  id                           text primary key,
  receipt_number               text not null,
  received_date                date not null,
  supplier_invoice_reference   text not null default '',
  item_id                      text not null,
  item_name                    text not null,
  item_code                    text not null,
  supplier_id                  text,
  supplier_name                text,
  country_of_origin            text,
  quantity_received            numeric(12,4) not null,
  quantity_available           numeric(12,4) not null,
  unit_label                   text not null default 'unit',
  unit_cost                    numeric(12,4) not null default 0,
  markup_percent               numeric(6,2)  not null default 0,
  sell_price                   numeric(12,4) not null default 0,
  status                       text not null default 'In stock',
  -- Optional pin to a specific customer/job when bought against an order.
  client_id                    text,
  client_name                  text,
  job_id                       text,
  job_number                   text,
  storage_location             text,
  notes                        text not null default '',
  photo_urls                   jsonb not null default '[]'::jsonb,
  created_at                   timestamptz not null default now(),
  updated_at                   timestamptz not null default now()
);

create index if not exists traded_goods_receipts_item_idx
  on public.traded_goods_receipts (item_id);
create index if not exists traded_goods_receipts_supplier_idx
  on public.traded_goods_receipts (supplier_id);
create index if not exists traded_goods_receipts_client_idx
  on public.traded_goods_receipts (client_id);
create index if not exists traded_goods_receipts_status_idx
  on public.traded_goods_receipts (status);

comment on table public.traded_goods_receipts is
  'Phase 93. Per-batch purchase records of traded goods — captures landed cost, sell price, on-hand qty, and optional client/job pinning. The inventory unit for traded goods.';

-- ════════════════════════════════════════════════════════════════════════
-- RLS — same pattern as the rest of the schema: anyone authenticated can
-- read/write. Tighten later if production / sales roles need scoping.
-- ════════════════════════════════════════════════════════════════════════
alter table public.traded_goods_items   enable row level security;
alter table public.traded_goods_receipts enable row level security;

do $$ begin
  create policy traded_goods_items_all
    on public.traded_goods_items
    for all
    to authenticated
    using (true) with check (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy traded_goods_receipts_all
    on public.traded_goods_receipts
    for all
    to authenticated
    using (true) with check (true);
exception when duplicate_object then null;
end $$;
