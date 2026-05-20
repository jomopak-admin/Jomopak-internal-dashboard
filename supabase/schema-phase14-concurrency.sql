-- Phase 14 — Optimistic Concurrency Control
--
-- Adds a `version` int + auto-incrementing trigger to the high-contention
-- tables. The client reads `version` along with the row, and on save it
-- compares the value it has against the value in the DB. If they differ,
-- another user wrote first and the client is told to refresh.
--
-- Why these tables?
--   jobs            — multiple ops/sales/production users can touch the same
--                     job in the same hour (status, dispatch, payment).
--   invoices        — accounts edits + sales edits race during month-end.
--   clients         — sales + accounts both update credit limit / addresses.
--   spare_parts     — stockroom + ops both move tools and consumables.
--
-- We do NOT add OCC to bulk-event tables (production_logs, paper_logs,
-- waste_entries, dispatch_records, etc.) — those are append-only by nature,
-- so contention is not a real concern.
--
-- Note: this migration does NOT block writes that ignore the version column.
-- The client is responsible for passing the version it loaded; if it doesn't
-- pass it, the row updates as before. The intent is to surface conflicts to
-- humans, not to enforce them at the DB level (where it would break the
-- existing bulk-upsert sync hook).

create or replace function public.bump_row_version()
returns trigger
language plpgsql
as $$
begin
  -- Only bump when the row actually changes. Avoids ratcheting version on
  -- no-op writes (e.g. the bulk upsert that re-saves unchanged rows).
  if to_jsonb(new) - 'version' - 'updated_at' is distinct from
     to_jsonb(old) - 'version' - 'updated_at' then
    new.version := coalesce(old.version, 0) + 1;
    new.updated_at := now();
  else
    new.version := old.version;
    new.updated_at := old.updated_at;
  end if;
  return new;
end;
$$;

-- Helper to add the column + trigger idempotently. We skip tables that
-- don't exist yet — `invoices` and `work_tickets` are created later by
-- schema-phase15-full-data-model.sql, which re-applies the trigger to
-- them after creation. This makes the migration order-tolerant.
do $$
declare
  t text;
begin
  for t in select unnest(array['jobs', 'invoices', 'clients', 'spare_parts'])
  loop
    if not exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = t
    ) then
      continue;
    end if;
    execute format('alter table public.%I add column if not exists version int not null default 1', t);
    execute format('alter table public.%I add column if not exists updated_at timestamptz not null default now()', t);
    execute format('drop trigger if exists %I on public.%I', t || '_bump_version', t);
    execute format($f$
      create trigger %I
      before update on public.%I
      for each row execute function public.bump_row_version()
    $f$, t || '_bump_version', t);
  end loop;
end$$;
