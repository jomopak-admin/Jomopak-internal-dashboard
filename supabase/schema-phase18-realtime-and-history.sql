-- Phase 18 — Realtime + Record History + Lock Audit
--
-- Three additions:
--
--   1. Add critical tables to the supabase_realtime publication so the
--      useRealtimeSync hook can subscribe to postgres_changes events.
--
--   2. Create a `record_history` table + a generic trigger that snapshots
--      every UPDATE on the critical tables. This gives us a per-row
--      git-style history we can show in the dashboard, independent of
--      the audit_events log (which tracks *actions*, not row state).
--
--   3. No new audit table — lock overrides are recorded by writing to
--      the existing audit_events table with action='lock_override' and a
--      details json describing who was displaced. Documented here only.
--
-- Idempotent — safe to re-run.

------------------------------------------------------------------------
-- 1. Realtime publication
------------------------------------------------------------------------

-- The Supabase `supabase_realtime` publication controls which tables
-- broadcast change events. We add the high-traffic tables; compliance /
-- audit tables stay off the publication to keep the per-user
-- subscription count low.
do $$
declare
  t text;
  critical_tables text[] := array[
    'jobs',
    'invoices',
    'leads',
    'clients',
    'quote_estimates',
    'work_tickets',
    'material_receipts',
    'dispatch_records',
    'finished_goods_stock',
    'proof_of_deliveries',
    'invoice_inbox_items'
  ];
begin
  foreach t in array critical_tables loop
    -- Skip if the table doesn't exist (defensive — keeps the migration
    -- runnable even if a table is renamed later).
    if not exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = t
    ) then
      continue;
    end if;
    -- Skip if already in the publication.
    if exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      continue;
    end if;
    execute format('alter publication supabase_realtime add table public.%I', t);
  end loop;
end$$;

------------------------------------------------------------------------
-- 2. Record history
------------------------------------------------------------------------

create table if not exists public.record_history (
  id bigserial primary key,
  table_name text not null,
  record_id text not null,
  -- The whole previous row state, captured BEFORE the update applied.
  previous_state jsonb not null,
  -- The new row state. Use jsonb so we can diff client-side.
  new_state jsonb not null,
  -- Best-effort attribution. auth.uid() of the user that triggered the
  -- update, plus a denormalised display name passed in via the client.
  changed_by_user_id uuid,
  changed_by_name text not null default '',
  changed_at timestamptz not null default now(),
  -- Optional: which columns actually changed (computed client-side or
  -- via the trigger). Helps the UI highlight diffs without re-parsing.
  changed_columns text[] not null default '{}'
);

create index if not exists record_history_lookup_idx
  on public.record_history(table_name, record_id, changed_at desc);

-- Function that captures a row's previous state to record_history.
-- Lives at the database level so we can't accidentally forget to log
-- from the application layer.
create or replace function public.snapshot_record_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  prev_json jsonb;
  new_json  jsonb;
  diff_cols text[];
  k text;
begin
  prev_json := to_jsonb(old);
  new_json  := to_jsonb(new);
  diff_cols := array[]::text[];
  for k in select jsonb_object_keys(new_json) loop
    -- Skip purely housekeeping columns when computing the diff so the
    -- changed-column list stays meaningful for the UI.
    if k in ('updated_at', 'version') then
      continue;
    end if;
    if (prev_json -> k) is distinct from (new_json -> k) then
      diff_cols := array_append(diff_cols, k);
    end if;
  end loop;

  -- If nothing meaningful changed, skip recording. Avoids spam from the
  -- existing bump_row_version trigger no-op write paths.
  if cardinality(diff_cols) = 0 then
    return new;
  end if;

  insert into public.record_history (
    table_name, record_id, previous_state, new_state,
    changed_by_user_id, changed_by_name, changed_columns
  )
  values (
    tg_table_name, new.id::text, prev_json, new_json,
    auth.uid(), coalesce(current_setting('request.jwt.claim.email', true), ''),
    diff_cols
  );

  return new;
end;
$$;

-- Attach the snapshot trigger to every critical table that has an `id`
-- text PK. We skip tables that don't exist yet so the migration is
-- order-tolerant.
do $$
declare
  t text;
  tracked_tables text[] := array[
    'jobs', 'invoices', 'clients', 'leads', 'quote_estimates',
    'work_tickets', 'material_receipts', 'spare_parts',
    'finished_goods_stock', 'proof_of_deliveries', 'invoice_inbox_items'
  ];
begin
  foreach t in array tracked_tables loop
    if not exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = t
    ) then
      continue;
    end if;
    execute format('drop trigger if exists %I on public.%I', t || '_snapshot_history', t);
    execute format(
      'create trigger %I after update on public.%I for each row execute function public.snapshot_record_history()',
      t || '_snapshot_history', t
    );
  end loop;
end$$;

-- RLS — authenticated users can read history; only the server (security
-- definer trigger) can write. No client-side writes to record_history.
alter table public.record_history enable row level security;

drop policy if exists record_history_select on public.record_history;
create policy record_history_select on public.record_history
  for select to authenticated using (true);

-- No insert/update/delete policy = no client writes allowed.
