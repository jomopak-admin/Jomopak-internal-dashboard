-- Phase 57 — Unified Company / Business Partner architecture
--
-- One Company record represents a real business entity. It plays one or
-- more roles (Client, Supplier, Manufacturer, Logistics, Partner, Other).
-- Shared details (legal name, VAT, contacts, address, banking) live here
-- ONCE. Per-role specifics (credit limit, lead times, MSDS, certifications)
-- live on the existing Client / Supplier records, which now point back
-- via company_id.
--
-- Backward-compat: existing clients + suppliers are untouched. Their
-- company_id starts NULL; admin links them retroactively via the
-- Companies page (or the "Link to Company" button on Client / Supplier
-- forms in a later phase).
--
-- Idempotent. Safe to re-run.

create table if not exists public.companies (
  id                      text        primary key,
  code                    text,
  created_at              timestamptz not null default now(),
  name                    text        not null,
  legal_name              text,
  registration_number     text,
  vat_number              text,
  roles                   jsonb       not null default '[]'::jsonb,
  primary_contact         jsonb,
  additional_contacts     jsonb       not null default '[]'::jsonb,
  address_line1           text,
  address_line2           text,
  city                    text,
  province                text,
  postal_code             text,
  country                 text,
  bank_name               text,
  bank_account_number     text,
  bank_branch_code        text,
  account_type            text,
  default_currency        text        not null default 'ZAR',
  default_payment_terms   text,
  industry                text,
  website                 text,
  notes                   text,
  active                  boolean     not null default true,
  linked_client_id        text,
  linked_supplier_id      text
);

create index if not exists companies_name_idx     on public.companies (lower(name));
create index if not exists companies_active_idx   on public.companies (active);
create index if not exists companies_roles_idx    on public.companies using gin (roles);
create index if not exists companies_vat_idx      on public.companies (vat_number);

alter table public.companies enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='companies' and policyname='companies_select') then
    create policy companies_select on public.companies for select using (auth.role()='authenticated');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='companies' and policyname='companies_write') then
    create policy companies_write on public.companies for all using (auth.role()='authenticated') with check (auth.role()='authenticated');
  end if;
end $$;

-- Back-pointers on the existing tables. Nullable so legacy records
-- remain valid; new ones can be linked via the Companies page.
alter table public.clients   add column if not exists company_id text;
alter table public.suppliers add column if not exists company_id text;

create index if not exists clients_company_id_idx   on public.clients (company_id);
create index if not exists suppliers_company_id_idx on public.suppliers (company_id);

notify pgrst, 'reload schema';
