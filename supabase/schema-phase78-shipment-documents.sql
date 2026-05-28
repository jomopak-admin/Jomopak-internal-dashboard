-- Phase 78: shipping documents on shipments.
--
-- The global drop-zone (drop anywhere on any page → pick "Shipment / Import
-- document" → pick a shipment) attaches files to shipments via
-- shipments.document_urls. This jsonb column holds the array of signed URLs
-- from the Supabase 'photos' storage bucket.
--
-- The same column is also used by the Shipment form's own document upload
-- (if it gets one in a future polish phase) — it's a single source of
-- truth for "what paperwork came with this import."
--
-- Idempotent: safe to run more than once.

alter table public.shipments
  add column if not exists document_urls jsonb default '[]'::jsonb;
