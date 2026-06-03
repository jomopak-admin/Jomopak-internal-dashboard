-- Phase 121 — Help videos per page.
--
-- Aman's design directive: low-literacy / low-skill staff must never have
-- the excuse "I didn't know how to use it". The dashboard surfaces a
-- "Watch how to use this page" link at the bottom of each staff-facing
-- page when a video URL is configured. He'll record step-by-step videos
-- and paste YouTube/Vimeo (unlisted) URLs in Settings → Help videos.
--
-- Stored as jsonb on app_settings because:
--   - small map, never queried inside SQL
--   - keys are page identifiers (match the View type in the React app)
--   - values are URLs
--   - missing keys naturally mean "no video for this page yet"
--
-- Idempotent: safe to run more than once.

alter table public.app_settings
  add column if not exists help_videos jsonb default '{}'::jsonb;

comment on column public.app_settings.help_videos is
  'Phase 121. Map of page-view-key -> video URL. Rendered as a friendly '
  '"Watch how to use this page" link at the bottom of staff-facing pages '
  'when a key is set. Drives the low-literacy help layer.';
