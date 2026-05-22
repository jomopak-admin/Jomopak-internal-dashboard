-- Phase 22 — Document Vault
--
-- Stores supplier + client documents (certifications, credit apps,
-- stock-level agreements, IDs, bank details, contracts, price lists).
-- Files live in the `documents` Storage bucket; this table holds metadata
-- + an optional expiry date that drives expiry notifications.
--
-- Idempotent — safe to re-run.

create table if not exists public.documents (
  id text primary key,
  created_at timestamptz not null default now(),
  owner_type text not null default 'supplier',   -- 'supplier' | 'client'
  owner_id text default '',
  owner_name text not null default '',
  category text not null default 'Other',
  title text not null default '',
  file_name text not null default '',
  file_mime_type text not null default '',
  file_size_bytes bigint not null default 0,
  file_url text not null default '',
  storage_path text not null default '',
  issue_date text not null default '',
  expiry_date text not null default '',
  uploaded_by_name text not null default '',
  notes text not null default ''
);

create index if not exists documents_owner_idx on public.documents(owner_type, owner_id);
create index if not exists documents_expiry_idx on public.documents(expiry_date);
create index if not exists documents_category_idx on public.documents(category);

alter table public.documents enable row level security;

drop policy if exists documents_select on public.documents;
create policy documents_select on public.documents for select to authenticated using (true);
drop policy if exists documents_insert on public.documents;
create policy documents_insert on public.documents for insert to authenticated with check (true);
drop policy if exists documents_update on public.documents;
create policy documents_update on public.documents for update to authenticated using (true) with check (true);
drop policy if exists documents_delete on public.documents;
create policy documents_delete on public.documents for delete to authenticated using (true);

-- Storage bucket for the actual files (private).
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

notify pgrst, 'reload schema';
