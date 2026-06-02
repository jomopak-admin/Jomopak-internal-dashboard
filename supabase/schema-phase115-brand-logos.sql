-- Phase 115 — Brand logo library.
--
-- Replaces the single company.logo_url field with an array of branded
-- logos, each with optional per-document-type pinning. The single
-- logo_url is kept for backward compatibility — print code that hasn't
-- been migrated yet still reads it; the multi-logo resolver in the
-- dashboard syncs the default brand logo into it on every save.
--
-- Stored as jsonb because the shape is small + never queried inside.
-- Idempotent: safe to run more than once.

alter table public.app_settings
  add column if not exists brand_logos jsonb default '[]'::jsonb;

-- One-time backfill: if a single logo_url is already set and the new
-- library is still empty, seed it as the default entry so the new
-- resolver finds it immediately.
update public.app_settings
   set brand_logos = jsonb_build_array(
     jsonb_build_object(
       'id', 'logo-legacy',
       'label', 'Main logo',
       'url', logo_url,
       'isDefault', true,
       'appliesToDocumentTypes', '[]'::jsonb,
       'uploadedAt', coalesce(updated_at, now()),
       'uploadedBy', coalesce(updated_by, '')
     )
   )
 where id = 'default'
   and brand_logos = '[]'::jsonb
   and logo_url is not null
   and logo_url <> '';
