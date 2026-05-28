-- Phase 62 — Tooling (Dies + Stereos)
--
-- One table for both, with a tool_type discriminator. Dies and Stereos
-- share most of their plumbing (photos, supplier, cost, status, usage
-- trail) so keeping them together avoids duplication. Each flavour has
-- a handful of nullable role-specific fields:
--
--   Die:    dimensions, bag/box type, handle style, sharpening_history
--   Stereo: client, design name, version, supersedes link, sign-off
--
-- Idempotent. Safe to re-run.

create table if not exists public.tooling (
  id                          text primary key,
  code                        text not null,                        -- DIE-202605-001 / STR-202605-001
  created_at                  timestamptz not null default now(),
  tool_type                   text not null check (tool_type in ('die','stereo')),
  name                        text not null,
  description                 text not null default '',
  -- Ownership / scope
  client_id                   text,                                 -- required for stereos, optional for dies
  client_name                 text not null default '',
  -- Location + supplier (external storage)
  location                    text not null default 'Internal' check (location in ('Internal','External')),
  supplier_id                 text,
  supplier_name               text not null default '',
  supplier_reference          text not null default '',
  internal_location           text not null default '',
  -- Cost trail
  cost                        numeric not null default 0,
  currency                    text not null default 'ZAR',
  paid_date                   date,
  supplier_invoice_number     text not null default '',
  -- Lifecycle
  status                      text not null default 'In Service',   -- see TOOLING_STATUSES
  active                      boolean not null default true,
  -- Files
  photo_urls                  jsonb not null default '[]'::jsonb,
  document_urls               jsonb not null default '[]'::jsonb,
  notes                       text not null default '',
  -- Usage trail
  last_used_at                timestamptz,
  run_count                   integer not null default 0,
  -- Die-specific (nullable for stereos)
  dimensions                  jsonb,                                 -- { widthMm, heightMm, depthMm }
  bag_type                    text,
  handle_type                 text,
  bottom_style                text,
  sharpening_history          jsonb not null default '[]'::jsonb,
  -- Stereo-specific (nullable for dies)
  design_name                 text,
  design_version              integer,
  supersedes_tool_id          text references public.tooling(id) on delete set null,
  superseded_by_tool_id       text references public.tooling(id) on delete set null,
  signed_off_by_name          text,
  signed_off_at               timestamptz,
  signature_data_url          text,
  signed_sample_document_url  text,
  -- Optimistic concurrency
  version                     integer not null default 1,
  row_updated_at              timestamptz not null default now()
);

create index if not exists tooling_tool_type_idx     on public.tooling (tool_type);
create index if not exists tooling_client_idx        on public.tooling (client_id);
create index if not exists tooling_supplier_idx      on public.tooling (supplier_id);
create index if not exists tooling_status_idx        on public.tooling (status);
create index if not exists tooling_active_idx        on public.tooling (active);
create index if not exists tooling_name_idx          on public.tooling (lower(name));
create index if not exists tooling_code_idx          on public.tooling (code);

-- Auto-bump version + row_updated_at on UPDATE.
create or replace function public.tooling_touch()
returns trigger
language plpgsql as $$
begin
  new.version := coalesce(old.version, 1) + 1;
  new.row_updated_at := now();
  return new;
end;
$$;

drop trigger if exists tooling_touch_trg on public.tooling;
create trigger tooling_touch_trg
  before update on public.tooling
  for each row execute function public.tooling_touch();

-- Back-references on jobs so we know which die / stereo was used.
alter table public.jobs
  add column if not exists die_tool_id     text references public.tooling(id) on delete set null,
  add column if not exists die_tool_code   text,
  add column if not exists stereo_tool_id  text references public.tooling(id) on delete set null,
  add column if not exists stereo_tool_code text;

create index if not exists jobs_die_tool_idx    on public.jobs (die_tool_id)    where die_tool_id is not null;
create index if not exists jobs_stereo_tool_idx on public.jobs (stereo_tool_id) where stereo_tool_id is not null;

-- RLS — same posture as the rest of the workspace.
alter table public.tooling enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='tooling' and policyname='tooling_select'
  ) then
    create policy tooling_select on public.tooling for select using (auth.role()='authenticated');
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='tooling' and policyname='tooling_write'
  ) then
    create policy tooling_write on public.tooling for all using (auth.role()='authenticated') with check (auth.role()='authenticated');
  end if;
end $$;

notify pgrst, 'reload schema';
