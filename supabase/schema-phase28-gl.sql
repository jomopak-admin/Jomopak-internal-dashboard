-- Phase 28 — General Ledger (double-entry journal entries)
--
--   * journal_entries — one row per journal, with the balanced debit/credit
--     lines stored as a jsonb array. Trial Balance, Balance Sheet and Income
--     Statement are derived in the app from POSTED entries.
--
-- Idempotent — safe to re-run.

create table if not exists public.journal_entries (
  id text primary key,
  entry_number text not null,
  date text not null default '',
  reference text not null default '',
  description text not null default '',
  status text not null default 'Draft',          -- Draft | Posted
  source text not null default 'manual',
  lines jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  notes text not null default ''
);

create index if not exists journal_entries_date_idx on public.journal_entries(date);
create index if not exists journal_entries_status_idx on public.journal_entries(status);

alter table public.journal_entries enable row level security;

drop policy if exists journal_entries_select on public.journal_entries;
create policy journal_entries_select on public.journal_entries for select to authenticated using (true);
drop policy if exists journal_entries_insert on public.journal_entries;
create policy journal_entries_insert on public.journal_entries for insert to authenticated with check (true);
drop policy if exists journal_entries_update on public.journal_entries;
create policy journal_entries_update on public.journal_entries for update to authenticated using (true) with check (true);
drop policy if exists journal_entries_delete on public.journal_entries;
create policy journal_entries_delete on public.journal_entries for delete to authenticated using (true);

notify pgrst, 'reload schema';
