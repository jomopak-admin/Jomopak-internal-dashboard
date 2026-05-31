-- Phase 94 — Job Pipeline (production-stage tracker).
--
-- One jsonb column per job that stores the per-stage tick-box checklist:
-- artwork → plates → ink → paper → production → finishing → packing → dispatch.
-- The application owns the shape; this column just persists it.
--
-- This migration is conditional. If the `public.jobs` table doesn't exist
-- yet (e.g. you're still running on localStorage for jobs), it no-ops cleanly.
-- Re-run safely after the jobs table is created and the column will be added.

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'jobs'
  ) then
    execute 'alter table public.jobs add column if not exists pipeline_stages jsonb';
    execute $cmt$
      comment on column public.jobs.pipeline_stages is
        'Phase 94. Production-stage checklist for this job — per-item pending/blocked/done with timestamps and blocker notes. Read via the JobPipelineTracker component on the job edit form and the Live Pipeline strip on the Client profile.'
    $cmt$;
  else
    raise notice 'Skipping phase 94 — public.jobs table does not exist yet. Re-run after creating it.';
  end if;
end $$;
