-- Phase 99 — Lead extensions: multi-item + niched source + onboarding form.
--
-- Conditional on the leads table existing. Safe to run anytime.
-- Adds:
--   items                          jsonb  — multi-product enquiry rows
--   source_detail                  text   — who referred / which campaign
--   onboarding_form_received       bool   — has the client form returned?
--   onboarding_form_received_date  date
--   onboarding_form_note           text   — chase note when not yet received

do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'leads'
  ) then
    raise notice 'Skipping phase 99 — public.leads table does not exist yet.';
    return;
  end if;

  execute 'alter table public.leads add column if not exists items jsonb';
  execute 'alter table public.leads add column if not exists source_detail text';
  execute 'alter table public.leads add column if not exists onboarding_form_received boolean not null default false';
  execute 'alter table public.leads add column if not exists onboarding_form_received_date date';
  execute 'alter table public.leads add column if not exists onboarding_form_note text';

  execute $cmt$
    comment on column public.leads.items is
      'Phase 99. Multi-item enquiry — array of { productId, productName, description, requestedQuantity, unit, specNote, estimatedValue }. First row backfills the legacy product_id / requested_quantity columns on save.'
  $cmt$;
  execute $cmt$
    comment on column public.leads.source_detail is
      'Phase 99. Free-text attribution — who referred / which campaign / which event name. Surfaced in the form only when the source needs it.'
  $cmt$;
  execute $cmt$
    comment on column public.leads.onboarding_form_received is
      'Phase 99. Has the JomoPak New Client Detail Form come back? Sales tick this; the bell can chase outstanding ones after N days.'
  $cmt$;
end $$;
