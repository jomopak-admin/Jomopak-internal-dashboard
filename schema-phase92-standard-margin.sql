-- Phase 92 — Company-wide standard margin %.
-- One number per AppSettings row that the calculator engine uses whenever
-- a line has no per-line / per-quote / tier / profile margin set.
-- Editable from Settings → Pricing (admin only).

alter table public.app_settings
  add column if not exists standard_margin_percent numeric(6,2) not null default 35;

comment on column public.app_settings.standard_margin_percent is
  'Phase 92. Company-wide markup % the calculator falls back to when no line / shared / tier / profile margin is set. Editable on Settings → Pricing by admins only.';
