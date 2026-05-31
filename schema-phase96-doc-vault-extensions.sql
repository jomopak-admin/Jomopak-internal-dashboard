-- Phase 96 — Doc Vault extensions for HR + SARS + retention.
--
-- Files themselves live in Supabase Storage (cheap, CDN). Only metadata
-- here in Postgres, which is why this is cheap to scale.
--
-- Adds:
--   - retention_days        = per-doc retention override (NULL → use category default)
--   - marked_for_archive    = admin marker that doc is safe to delete in bulk
--   - employee_id           = direct pointer to employee when owner_type='employee'
--
-- DEFENSIVE: every step checks its prerequisite individually so this works
-- whether your `documents` table is the full Phase 36 shape, a partial one,
-- or doesn't exist yet.

do $$
declare
  v_has_owner_type   boolean;
  v_has_employee_id  boolean;
begin
  -- Bail out cleanly if there's no documents table at all.
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'documents'
  ) then
    raise notice 'Skipping phase 96 — public.documents table does not exist yet. Re-run after creating it.';
    return;
  end if;

  -- Always-safe columns (don't depend on anything pre-existing).
  execute 'alter table public.documents add column if not exists retention_days integer';
  execute 'alter table public.documents add column if not exists marked_for_archive boolean not null default false';
  execute 'alter table public.documents add column if not exists employee_id text';

  -- owner_type might not exist if Phase 36 wasn't fully applied.
  -- We'll add it if missing so the app can use it.
  execute 'alter table public.documents add column if not exists owner_type text';
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'documents' and column_name = 'owner_type'
  ) into v_has_owner_type;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'documents' and column_name = 'employee_id'
  ) into v_has_employee_id;

  -- Indexes — only if the column they target actually exists.
  if v_has_owner_type then
    execute 'create index if not exists documents_owner_type_idx on public.documents (owner_type)';
  end if;
  if v_has_employee_id then
    execute 'create index if not exists documents_employee_idx on public.documents (employee_id)';
  end if;

  -- Column comments — safe to run, descriptive only.
  execute $cmt$
    comment on column public.documents.retention_days is
      'Phase 96. Per-doc retention override in days. NULL means use the category default (DOCUMENT_CATEGORY_RETENTION_DAYS in code).'
  $cmt$;
  execute $cmt$
    comment on column public.documents.marked_for_archive is
      'Phase 96. Admin marker that this doc is past retention and safe to bulk-delete. File stays in Storage until manual purge.'
  $cmt$;
  execute $cmt$
    comment on column public.documents.employee_id is
      'Phase 96. Direct link to employee when owner_type = ''employee''. Makes per-employee doc tabs trivial to query.'
  $cmt$;
end $$;
