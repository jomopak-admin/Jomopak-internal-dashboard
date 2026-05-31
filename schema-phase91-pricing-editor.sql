-- Phase 91 — CEO discount mode.
-- Per-user grant: when true, this user sees the per-line cost / margin /
-- what-if widget on the calculator and can override standard pricing.
-- Admins always have this regardless of the flag.

alter table public.profiles
  add column if not exists pricing_editor boolean not null default false;

comment on column public.profiles.pricing_editor is
  'Phase 91. When true, this profile can see costs/margins and override pricing on the calculator (CEO discount mode). Admins always have this regardless of the flag.';
