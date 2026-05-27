-- Phase 59 — Photos on Products, Spares, Jobs, Employees, Finished Stock
-- Each table gets a nullable jsonb column storing an array of public
-- URLs from the `photos` Supabase Storage bucket. Existing rows are
-- untouched (NULL = no photos).
-- Idempotent. Safe to re-run.

alter table public.products            add column if not exists photo_urls jsonb;
alter table public.spare_parts         add column if not exists photo_urls jsonb;
alter table public.jobs                add column if not exists photo_urls jsonb;
alter table public.employees           add column if not exists photo_urls jsonb;
alter table public.finished_goods_stock add column if not exists photo_urls jsonb;

-- ─────────────────────────────────────────────────────────────────────
-- Storage bucket — public, read-only to anyone with the URL.
-- Uploads gated by RLS to authenticated users only.
-- ─────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do update set public = true;

-- Storage policies — authenticated users can upload, anyone can read.
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='photos_read') then
    create policy photos_read on storage.objects for select
      using (bucket_id = 'photos');
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='photos_write') then
    create policy photos_write on storage.objects for insert
      with check (bucket_id = 'photos' and auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='photos_delete') then
    create policy photos_delete on storage.objects for delete
      using (bucket_id = 'photos' and auth.role() = 'authenticated');
  end if;
end $$;

notify pgrst, 'reload schema';
