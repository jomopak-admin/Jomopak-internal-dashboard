-- Phase 116 — Per-client preferred logo.
--
-- When a customer-facing document (invoice, delivery note, quote, stock
-- statement, customer statement, etc.) is printed, the dashboard's logo
-- resolver checks the linked client's preferredLogoId first. If set and
-- the id still exists in app_settings.brand_logos, that logo wins over the
-- dashboard default.
--
-- This is for customers who insist on seeing the supplier letterhead in a
-- specific variant — typically the FSC-certified mark vs. the plain mark,
-- or a co-branded version we keep just for one big retailer.
--
-- Stored as a plain text id pointing into the jsonb brand_logos array;
-- we keep referential integrity in the app layer rather than in SQL so an
-- admin deleting a logo doesn't cascade-null every client row that
-- referenced it. The resolver gracefully falls through to the default.
--
-- Idempotent: safe to run more than once.

alter table public.clients
  add column if not exists preferred_logo_id text;

comment on column public.clients.preferred_logo_id is
  'Phase 116. Optional id matching an entry in app_settings.brand_logos. '
  'When set, customer-facing printables for this client use that logo.';
