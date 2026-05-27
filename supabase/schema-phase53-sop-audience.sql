-- Phase 53 — SOP audience targeting
-- Two new columns on sop_documents:
--   audience_roles    jsonb   — array of role names that must acknowledge.
--                              null / empty => no targeting (legacy).
--   mandatory_for_all boolean — overrides audience_roles; show to everyone.
--
-- Idempotent. Safe to re-run.

alter table public.sop_documents add column if not exists audience_roles jsonb;
alter table public.sop_documents add column if not exists mandatory_for_all boolean not null default false;

notify pgrst, 'reload schema';
