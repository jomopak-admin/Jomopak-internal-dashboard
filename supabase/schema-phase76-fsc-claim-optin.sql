-- Phase 76: FSC claim is per-job, per-client opt-in.
--
-- FSC paper sitting in stock is NOT automatically an FSC claim on the
-- finished bag. The claim is a sales decision driven by the customer:
-- some clients want it on every job (will pay the premium for the
-- certified label), others don't care and we use the same FSC paper
-- without claiming.
--
-- Phase 76 captures the decision in two places:
--   - clients.default_fsc_claim — the client's standing preference, used
--     to auto-fill new jobs. Sales can still override per job.
--   - jobs.fsc_claim_enabled — the per-job flag actually consulted by
--     computeFgFsc on the FG Stock page. Both this AND a non-'None'
--     fscClaimType on the source material are required for the FG batch
--     to inherit an FSC claim.
--
-- Defaults are false — we never claim FSC by accident.
--
-- Idempotent: safe to run more than once.

alter table public.clients
  add column if not exists default_fsc_claim boolean default false;

alter table public.jobs
  add column if not exists fsc_claim_enabled boolean default false;
