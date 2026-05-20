-- Phase 17 — Driver POD + Supplier-invoice OCR Inbox
--
-- Tables:
--   proof_of_deliveries    (Task #81)
--   invoice_inbox_items    (Task #82)
--
-- Storage buckets (run separately in Supabase Storage UI):
--   pod-signatures         private; only authenticated read
--   pod-photos             private; only authenticated read
--   invoice-inbox          private; only authenticated read
--
-- All ids are app-generated text codes (POD-202605-001, INV-INBOX-001, etc.)
-- so the client never has to wait for a server-side UUID.
-- The migration is idempotent — every CREATE has `if not exists`.

------------------------------------------------------------------------
-- 1. Proof of Delivery
------------------------------------------------------------------------

create table if not exists public.proof_of_deliveries (
  id text primary key,
  pod_number text not null,
  created_at timestamptz not null default now(),
  dispatch_record_id text default '',
  dispatch_number text not null default '',
  job_id text default '',
  job_number text not null default '',
  client_id text default '',
  client_name text not null default '',
  driver_name text not null default '',
  driver_user_id uuid,
  receiver_name text not null default '',
  receiver_role text not null default '',
  receiver_company text not null default '',
  receiver_id_number text not null default '',
  receiver_phone text not null default '',
  outcome text not null default 'Delivered',
  failure_reason text not null default '',
  quantity_delivered numeric(14, 4) not null default 0,
  quantity_unit text not null default 'units',
  goods_condition text not null default 'Good',
  condition_notes text not null default '',
  captured_at timestamptz,
  gps_latitude double precision not null default 0,
  gps_longitude double precision not null default 0,
  gps_accuracy_meters numeric(10, 2) not null default 0,
  -- URLs of files in Supabase Storage; signature is a PNG, photos can be
  -- jpg/png/webp. We don't store the file bytes in the row.
  signature_url text not null default '',
  signed_document_photo_url text not null default '',
  goods_photo_urls text[] not null default '{}',
  notes text not null default '',
  -- Sync metadata. Rows only land here once they've been synced from the
  -- driver phone, but we keep the column so future server-side imports can
  -- mark themselves accordingly.
  sync_status text not null default 'synced',
  sync_error text not null default ''
);

create index if not exists pod_dispatch_record_id_idx on public.proof_of_deliveries(dispatch_record_id);
create index if not exists pod_job_id_idx on public.proof_of_deliveries(job_id);
create index if not exists pod_outcome_idx on public.proof_of_deliveries(outcome);
create index if not exists pod_captured_at_idx on public.proof_of_deliveries(captured_at);

------------------------------------------------------------------------
-- 2. Invoice Inbox (OCR pipeline)
------------------------------------------------------------------------

create table if not exists public.invoice_inbox_items (
  id text primary key,
  inbox_number text not null,
  created_at timestamptz not null default now(),
  -- Where the invoice came from. New channels (whatsapp/email/messaging)
  -- can be added in code without a migration since this is a text col.
  source text not null default 'manualUpload',
  uploader_name text not null default '',
  uploader_user_id uuid,
  file_name text not null default '',
  file_mime_type text not null default '',
  file_size_bytes bigint not null default 0,
  file_url text not null default '',
  storage_path text not null default '',
  file_hash text not null default '',
  status text not null default 'pending',
  ocr_error text not null default '',
  -- Raw and validated extractions live as jsonb so we can iterate on the
  -- shape without re-migrating.
  extracted_json jsonb,
  validated_json jsonb,
  reviewed_by_name text not null default '',
  reviewed_at timestamptz,
  review_notes text not null default '',
  posted_as_material_receipt_id text default '',
  posted_as_material_receipt_number text not null default '',
  posted_as_ap_invoice_id text default '',
  posted_at timestamptz,
  duplicate_candidate_ids text[] not null default '{}',
  sender_handle text not null default '',
  sender_subject text not null default ''
);

create index if not exists invoice_inbox_status_idx on public.invoice_inbox_items(status);
create index if not exists invoice_inbox_source_idx on public.invoice_inbox_items(source);
create index if not exists invoice_inbox_file_hash_idx on public.invoice_inbox_items(file_hash);
create index if not exists invoice_inbox_created_at_idx on public.invoice_inbox_items(created_at desc);

------------------------------------------------------------------------
-- 3. RLS policies
------------------------------------------------------------------------

do $$
declare
  t text;
  new_tables text[] := array['proof_of_deliveries', 'invoice_inbox_items'];
begin
  foreach t in array new_tables loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists %I on public.%I', t || '_select', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (true)',
      t || '_select', t
    );

    execute format('drop policy if exists %I on public.%I', t || '_insert', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (true)',
      t || '_insert', t
    );

    execute format('drop policy if exists %I on public.%I', t || '_update', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using (true) with check (true)',
      t || '_update', t
    );

    execute format('drop policy if exists %I on public.%I', t || '_delete', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (true)',
      t || '_delete', t
    );
  end loop;
end$$;

------------------------------------------------------------------------
-- 4. Storage buckets (run once via Supabase UI or supabase storage CLI)
------------------------------------------------------------------------
-- The following blocks try to create the required buckets directly. If
-- your Supabase project doesn't allow inserting into storage.buckets via
-- SQL (some versions restrict this to the dashboard / service role), the
-- inserts will harmlessly no-op when wrapped in `on conflict do nothing`,
-- and you can finish the buckets via the Storage UI.
insert into storage.buckets (id, name, public)
values
  ('pod-signatures', 'pod-signatures', false),
  ('pod-photos',     'pod-photos',     false),
  ('invoice-inbox',  'invoice-inbox',  false)
on conflict (id) do nothing;
