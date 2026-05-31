-- ─────────────────────────────────────────────────────────────────────────
-- Phase 103 — Partner access + Audit Programmes register.
--
-- Three independent additions (idempotent, safe to re-run):
--   1. profiles: add `inbox_categories` (jsonb[] of InboxCategory),
--      `partner_scope` (jsonb of PartnerScope[]), and
--      `can_post_invoices` (boolean default false).
--      Drives the per-user inbox filter + external partner scoping
--      (HR / legal / accounting / marketing / audit).
--   2. accountType already lives in profiles; we don't alter its check
--      constraint here (it accepts any text). The application is the
--      source of truth for valid values.
--   3. audit_programmes: SMETA / FSC / FSSC / ISO etc. cadence register,
--      consumed by the Activity Inbox to emit "Audit due in N days" events.
-- ─────────────────────────────────────────────────────────────────────────

-- ── 1) profiles extensions ────────────────────────────────────────────────
alter table if exists public.profiles
  add column if not exists inbox_categories jsonb default '[]'::jsonb,
  add column if not exists partner_scope    jsonb default '[]'::jsonb,
  add column if not exists can_post_invoices boolean default false;

comment on column public.profiles.inbox_categories is
  'Phase 103.3 — array of InboxCategory strings the user is allowed to see in the Inbox. Empty = unrestricted (admin / ops default).';
comment on column public.profiles.partner_scope is
  'Phase 103.4 — array of PartnerScope strings (hr | legal | accounting | marketing | audit). Only meaningful when account_type = external_partner.';
comment on column public.profiles.can_post_invoices is
  'Phase 103.4 — when true, an external_partner with the ''accounting'' scope can upload supplier invoices into the Invoice Inbox. Internal accounts staff always can.';

-- ── 2) audit_programmes ───────────────────────────────────────────────────
create table if not exists public.audit_programmes (
  id text primary key,
  code text default '',
  name text not null,
  auditing_body text default '',
  contact_email text default '',
  last_audited_date date,
  cadence_months integer not null default 12,
  next_due_date_override date,
  notes text default '',
  status text not null default 'Active',
  certificate_url text default '',
  certificate_expiry_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.audit_programmes is
  'Phase 103.2 — external audit programmes (SMETA, FSC, FSSC, ISO, etc) with cadence-driven next-due-date logic.';

-- Helpful for finding what''s due soon in dashboards / inbox producers.
create index if not exists audit_programmes_status_idx
  on public.audit_programmes(status);
create index if not exists audit_programmes_last_audited_idx
  on public.audit_programmes(last_audited_date);

-- ── 3) RLS — match the project-wide pattern (authenticated full access) ──
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='audit_programmes') then
    execute 'alter table public.audit_programmes enable row level security';
    execute $sql$create policy "audit_programmes authenticated full" on public.audit_programmes
      for all to authenticated using (true) with check (true)$sql$;
  end if;
end $$;
