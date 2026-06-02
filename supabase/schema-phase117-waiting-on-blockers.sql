-- Phase 117 — "Waiting on" blockers for Quotes & Jobs.
--
-- Real factory pattern: a quote sits half-done because someone is waiting
-- for a die cost from the toolmaker, a board cost from the paper rep, or
-- artwork approval from the client. Same on jobs — production parked
-- waiting for tooling, paper, or a food-safe sign-off.
--
-- Each work item carries an array of these blockers. Stored as jsonb
-- because:
--   - The shape is small and we never query inside it from SQL.
--   - We need flexible per-blocker fields (party, optional partyName,
--     reason, expectedBy, createdAt/by, resolvedAt/by, resolutionNote)
--     without a second join table.
--   - The resolver logic + filter chips live in the app layer.
--
-- Defaults to an empty array so existing rows stay valid. Idempotent —
-- safe to run more than once.

alter table public.quote_estimates
  add column if not exists waiting_on jsonb default '[]'::jsonb;

alter table public.jobs
  add column if not exists waiting_on jsonb default '[]'::jsonb;

-- Belt-and-braces: if any pre-existing rows have null (from a previous
-- schema mistake), backfill to the empty array so the mapper doesn't
-- have to special-case nulls.
update public.quote_estimates
   set waiting_on = '[]'::jsonb
 where waiting_on is null;

update public.jobs
   set waiting_on = '[]'::jsonb
 where waiting_on is null;

comment on column public.quote_estimates.waiting_on is
  'Phase 117. Array of WaitingOnBlocker — party, reason, expectedBy, '
  'resolvedAt. Drives the "Waiting on N" chips on the Quotes list and '
  'the overdue surfacing on the dashboard.';

comment on column public.jobs.waiting_on is
  'Phase 117. Array of WaitingOnBlocker — same shape as on quotes. '
  'Lets production park a job ("waiting for paper from Sappi") without '
  'losing track of it.';
