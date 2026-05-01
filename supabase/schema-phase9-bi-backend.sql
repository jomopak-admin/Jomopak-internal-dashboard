create extension if not exists pgcrypto;

create table if not exists public.bi_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  occurred_at timestamptz not null default now(),
  source_table text not null,
  source_record_id text not null,
  event_category text not null,
  event_type text not null,
  action text not null,
  summary text not null,
  actor_name text,
  job_id text,
  job_number text,
  client_id text,
  client_name text,
  visibility_scope text not null default 'internal' check (visibility_scope in ('internal', 'client_shared', 'client_only')),
  details jsonb not null default '{}'::jsonb
);

create index if not exists bi_events_occurred_at_idx
on public.bi_events (occurred_at desc);

create index if not exists bi_events_job_id_idx
on public.bi_events (job_id);

create index if not exists bi_events_client_id_idx
on public.bi_events (client_id);

create index if not exists bi_events_source_idx
on public.bi_events (source_table, source_record_id);

create or replace function public.bi_event_is_internal_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and coalesce(p.account_type, 'internal') <> 'client'
  )
$$;

create or replace function public.bi_can_read_event(target_job_id text, target_client_id text, target_visibility_scope text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.bi_event_is_internal_user()
    or (
      coalesce(target_visibility_scope, 'internal') <> 'internal'
      and exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.account_type = 'client'
          and p.client_id is not null
          and p.client_id = target_client_id
      )
    )
$$;

create or replace function public.insert_bi_event(
  p_source_table text,
  p_source_record_id text,
  p_event_category text,
  p_event_type text,
  p_action text,
  p_summary text,
  p_actor_name text,
  p_job_id text,
  p_job_number text,
  p_client_id text,
  p_client_name text,
  p_visibility_scope text,
  p_details jsonb
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.bi_events (
    source_table,
    source_record_id,
    event_category,
    event_type,
    action,
    summary,
    actor_name,
    job_id,
    job_number,
    client_id,
    client_name,
    visibility_scope,
    details
  )
  values (
    p_source_table,
    p_source_record_id,
    p_event_category,
    p_event_type,
    p_action,
    p_summary,
    nullif(p_actor_name, ''),
    nullif(p_job_id, ''),
    nullif(p_job_number, ''),
    nullif(p_client_id, ''),
    nullif(p_client_name, ''),
    coalesce(nullif(p_visibility_scope, ''), 'internal'),
    coalesce(p_details, '{}'::jsonb)
  )
$$;

create or replace function public.trg_bi_events_for_jobs()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  summary_text text;
  event_type_text text;
  action_text text;
  details_json jsonb;
begin
  if tg_op = 'INSERT' then
    perform public.insert_bi_event(
      'jobs',
      new.id,
      'job',
      'job_created',
      'created',
      format('Job %s created for %s', coalesce(new.job_number, new.id), coalesce(new.customer_name, 'client')),
      coalesce(new.captured_by, new.sales_owner_name, new.released_by, 'System'),
      new.id,
      new.job_number,
      new.client_id,
      new.customer_name,
      'internal',
      jsonb_build_object('status', new.status, 'payment_status', new.payment_status, 'artwork_status', new.artwork_preparation_status)
    );
    return new;
  end if;

  event_type_text := 'job_updated';
  action_text := 'updated';
  summary_text := format('Job %s updated', coalesce(new.job_number, new.id));

  if new.status is distinct from old.status then
    event_type_text := 'job_status_changed';
    action_text := 'status_changed';
    summary_text := format('Job %s moved to %s', coalesce(new.job_number, new.id), coalesce(new.status, 'Unknown'));
  elsif new.artwork_preparation_status is distinct from old.artwork_preparation_status then
    event_type_text := 'artwork_status_changed';
    action_text := 'artwork_status_changed';
    summary_text := format('Artwork status for %s changed to %s', coalesce(new.job_number, new.id), coalesce(new.artwork_preparation_status, 'Unknown'));
  elsif new.approval_status is distinct from old.approval_status then
    event_type_text := 'approval_status_changed';
    action_text := 'approval_status_changed';
    summary_text := format('Approval status for %s changed to %s', coalesce(new.job_number, new.id), coalesce(new.approval_status, 'Unknown'));
  elsif new.payment_status is distinct from old.payment_status then
    event_type_text := 'payment_status_changed';
    action_text := 'payment_status_changed';
    summary_text := format('Payment status for %s changed to %s', coalesce(new.job_number, new.id), coalesce(new.payment_status, 'Unknown'));
  elsif new.dispatch_status is distinct from old.dispatch_status then
    event_type_text := 'dispatch_status_changed';
    action_text := 'dispatch_status_changed';
    summary_text := format('Dispatch status for %s changed to %s', coalesce(new.job_number, new.id), coalesce(new.dispatch_status, 'Unknown'));
  elsif new.collection_or_delivery_status is distinct from old.collection_or_delivery_status then
    event_type_text := 'delivery_status_changed';
    action_text := 'delivery_status_changed';
    summary_text := format('Delivery status for %s changed to %s', coalesce(new.job_number, new.id), coalesce(new.collection_or_delivery_status, 'Unknown'));
  end if;

  details_json := jsonb_build_object(
    'previous_status', old.status,
    'next_status', new.status,
    'previous_approval_status', old.approval_status,
    'next_approval_status', new.approval_status,
    'previous_payment_status', old.payment_status,
    'next_payment_status', new.payment_status
  );

  perform public.insert_bi_event(
    'jobs',
    new.id,
    'job',
    event_type_text,
    action_text,
    summary_text,
    coalesce(new.released_by, new.captured_by, new.sales_owner_name, 'System'),
    new.id,
    new.job_number,
    new.client_id,
    new.customer_name,
    'internal',
    details_json
  );

  return new;
end;
$$;

create or replace function public.trg_bi_events_for_artwork()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  event_type_text text;
  action_text text;
  summary_text text;
begin
  if tg_op = 'INSERT' then
    event_type_text := 'artwork_record_created';
    action_text := 'created';
    summary_text := format('Artwork record opened for %s', coalesce(new.job_number, new.id));
  else
    event_type_text := 'artwork_stage_changed';
    action_text := 'stage_changed';
    summary_text := format('Artwork stage for %s changed to %s', coalesce(new.job_number, new.id), coalesce(new.stage, 'Unknown'));
  end if;

  perform public.insert_bi_event(
    'artwork_records',
    new.id,
    'artwork',
    event_type_text,
    action_text,
    summary_text,
    coalesce(new.notes, 'Artwork'),
    new.job_id,
    new.job_number,
    new.client_id,
    new.client_name,
    case when new.approval_date is not null or new.proof_sent_date is not null then 'client_shared' else 'internal' end,
    jsonb_build_object('stage', new.stage, 'approval_date', new.approval_date, 'proof_sent_date', new.proof_sent_date)
  );

  return new;
end;
$$;

create or replace function public.trg_bi_events_for_production_logs()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.insert_bi_event(
    'production_logs',
    new.id,
    'production',
    'production_logged',
    'logged',
    format('%s logged for %s', coalesce(new.log_type, 'Production activity'), coalesce(new.job_number, new.id)),
    coalesce(new.operator_name, 'Production'),
    new.job_id,
    new.job_number,
    null,
    new.customer_name,
    'internal',
    jsonb_build_object('machine', new.machine, 'log_type', new.log_type, 'good_bags', new.good_bags, 'quantity_printed', new.quantity_printed)
  );
  return new;
end;
$$;

create or replace function public.trg_bi_events_for_waste_entries()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.insert_bi_event(
    'waste_entries',
    new.id,
    'waste',
    'waste_logged',
    'logged',
    format('Waste logged for %s: %s', coalesce(new.job_number, new.id), coalesce(new.waste_reason, 'Unspecified')),
    coalesce(new.entered_by, 'Production'),
    new.job_id,
    new.job_number,
    null,
    new.customer_name,
    'internal',
    jsonb_build_object('waste_quantity', new.waste_quantity, 'waste_unit', new.waste_unit, 'waste_reason', new.waste_reason)
  );
  return new;
end;
$$;

create or replace function public.trg_bi_events_for_paper_logs()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.insert_bi_event(
    'paper_logs',
    new.id,
    'paper',
    'paper_logged',
    'logged',
    format('Paper usage logged for %s: %s', coalesce(new.job_number, new.id), coalesce(new.paper_type, 'Paper')),
    coalesce(new.paper_code, 'Paper'),
    new.job_id,
    new.job_number,
    null,
    new.customer_name,
    'internal',
    jsonb_build_object('paper_type', new.paper_type, 'quantity_used', new.quantity_used, 'quantity_unit', new.quantity_unit)
  );
  return new;
end;
$$;

create or replace function public.trg_bi_events_for_dispatch_records()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.insert_bi_event(
    'dispatch_records',
    new.id,
    'dispatch',
    'dispatch_logged',
    'logged',
    format('Dispatch %s recorded for %s', coalesce(new.dispatch_number, new.id), coalesce(new.job_number, 'job')),
    coalesce(new.delivery_reference, new.label_reference, 'Dispatch'),
    new.job_id,
    new.job_number,
    null,
    new.customer_name,
    'client_shared',
    jsonb_build_object('dispatch_number', new.dispatch_number, 'quantity_dispatched', new.quantity_dispatched, 'quantity_unit', new.quantity_unit)
  );
  return new;
end;
$$;

create or replace function public.trg_bi_events_for_inventory_movements()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.insert_bi_event(
    'inventory_movements',
    new.id,
    'inventory',
    'inventory_moved',
    'moved',
    format('Inventory %s for %s', coalesce(new.movement_type, 'movement'), coalesce(new.job_number, new.item_name, new.id)),
    coalesce(new.moved_by_name, 'Inventory'),
    new.job_id,
    new.job_number,
    null,
    null,
    'internal',
    jsonb_build_object('item_name', new.item_name, 'quantity_moved', new.quantity_moved, 'from_location', new.from_location, 'to_location', new.to_location)
  );
  return new;
end;
$$;

create or replace function public.trg_bi_events_for_material_orders()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  event_type_text text;
  action_text text;
  summary_text text;
begin
  if tg_op = 'INSERT' then
    event_type_text := 'material_order_created';
    action_text := 'created';
    summary_text := format('Material order %s created for %s', coalesce(new.order_number, new.id), coalesce(new.job_number, 'job'));
  else
    event_type_text := 'material_order_status_changed';
    action_text := 'status_changed';
    summary_text := format('Material order %s moved to %s', coalesce(new.order_number, new.id), coalesce(new.status, 'Unknown'));
  end if;

  perform public.insert_bi_event(
    'material_order_requests',
    new.id,
    'procurement',
    event_type_text,
    action_text,
    summary_text,
    coalesce(new.requested_by, 'Procurement'),
    new.job_id,
    new.job_number,
    new.client_id,
    new.client_name,
    'internal',
    jsonb_build_object('paper_type', new.paper_type, 'gsm', new.gsm, 'quantity_required', new.quantity_required, 'status', new.status)
  );
  return new;
end;
$$;

drop trigger if exists bi_events_jobs_trigger on public.jobs;
create trigger bi_events_jobs_trigger
after insert or update on public.jobs
for each row execute function public.trg_bi_events_for_jobs();

drop trigger if exists bi_events_artwork_trigger on public.artwork_records;
create trigger bi_events_artwork_trigger
after insert or update on public.artwork_records
for each row execute function public.trg_bi_events_for_artwork();

drop trigger if exists bi_events_production_logs_trigger on public.production_logs;
create trigger bi_events_production_logs_trigger
after insert on public.production_logs
for each row execute function public.trg_bi_events_for_production_logs();

drop trigger if exists bi_events_waste_entries_trigger on public.waste_entries;
create trigger bi_events_waste_entries_trigger
after insert on public.waste_entries
for each row execute function public.trg_bi_events_for_waste_entries();

drop trigger if exists bi_events_paper_logs_trigger on public.paper_logs;
create trigger bi_events_paper_logs_trigger
after insert on public.paper_logs
for each row execute function public.trg_bi_events_for_paper_logs();

drop trigger if exists bi_events_dispatch_records_trigger on public.dispatch_records;
create trigger bi_events_dispatch_records_trigger
after insert on public.dispatch_records
for each row execute function public.trg_bi_events_for_dispatch_records();

drop trigger if exists bi_events_inventory_movements_trigger on public.inventory_movements;
create trigger bi_events_inventory_movements_trigger
after insert on public.inventory_movements
for each row execute function public.trg_bi_events_for_inventory_movements();

drop trigger if exists bi_events_material_orders_trigger on public.material_order_requests;
create trigger bi_events_material_orders_trigger
after insert or update on public.material_order_requests
for each row execute function public.trg_bi_events_for_material_orders();

alter table public.bi_events enable row level security;

drop policy if exists "bi_events_select_secure" on public.bi_events;
create policy "bi_events_select_secure"
on public.bi_events for select
to authenticated
using (public.bi_can_read_event(job_id, client_id, visibility_scope));

drop policy if exists "bi_events_no_direct_insert" on public.bi_events;
create policy "bi_events_no_direct_insert"
on public.bi_events for insert
to authenticated
with check (false);

revoke all on function public.bi_event_is_internal_user() from public;
grant execute on function public.bi_event_is_internal_user() to authenticated;

revoke all on function public.bi_can_read_event(text, text, text) from public;
grant execute on function public.bi_can_read_event(text, text, text) to authenticated;

revoke all on function public.insert_bi_event(text, text, text, text, text, text, text, text, text, text, text, text, jsonb) from public;
grant execute on function public.insert_bi_event(text, text, text, text, text, text, text, text, text, text, text, text, jsonb) to authenticated;
