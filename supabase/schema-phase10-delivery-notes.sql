create table if not exists public.delivery_notes (
  id text primary key,
  delivery_note_number text not null,
  created_at timestamptz not null default now(),
  note_date date not null,
  client_id text,
  client_name text,
  client_contact_name text,
  client_contact_phone text,
  client_email text,
  client_address text,
  company_name text,
  company_phone text,
  company_email text,
  company_address text,
  job_id text,
  job_number text,
  dispatch_record_ids text[] not null default '{}',
  customer_stock_release_ids text[] not null default '{}',
  delivery_method text not null default 'Delivery',
  delivery_reference text,
  vehicle_registration text,
  driver_name text,
  dispatched_by text,
  received_by text,
  status text not null default 'Draft',
  client_visible boolean not null default true,
  line_items jsonb not null default '[]'::jsonb,
  notes text
);

create unique index if not exists delivery_notes_number_unique_idx
on public.delivery_notes (delivery_note_number);

create index if not exists delivery_notes_client_idx
on public.delivery_notes (client_id, note_date desc);

create index if not exists delivery_notes_job_idx
on public.delivery_notes (job_id, note_date desc);

alter table public.delivery_notes enable row level security;

drop policy if exists "delivery_notes_select_secure" on public.delivery_notes;
create policy "delivery_notes_select_secure"
on public.delivery_notes for select
to authenticated
using (
  public.is_internal_user()
  or (
    client_visible = true
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.account_type = 'client'
        and p.client_id is not null
        and p.client_id = delivery_notes.client_id
    )
  )
);

drop policy if exists "delivery_notes_manage_internal" on public.delivery_notes;
create policy "delivery_notes_manage_internal"
on public.delivery_notes for all
to authenticated
using (public.is_internal_user())
with check (public.is_internal_user());

create or replace function public.trg_bi_events_for_delivery_notes()
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
    event_type_text := 'delivery_note_created';
    action_text := 'created';
    summary_text := format('Delivery note %s issued for %s', coalesce(new.delivery_note_number, new.id), coalesce(new.client_name, 'client'));
  else
    event_type_text := 'delivery_note_updated';
    action_text := 'updated';
    summary_text := format('Delivery note %s updated to %s', coalesce(new.delivery_note_number, new.id), coalesce(new.status, 'Draft'));
  end if;

  perform public.insert_bi_event(
    'delivery_notes',
    new.id,
    'delivery',
    event_type_text,
    action_text,
    summary_text,
    coalesce(new.dispatched_by, 'Dispatch'),
    new.job_id,
    new.job_number,
    new.client_id,
    new.client_name,
    case when new.client_visible then 'client_shared' else 'internal' end,
    jsonb_build_object(
      'delivery_method', new.delivery_method,
      'status', new.status,
      'delivery_reference', new.delivery_reference,
      'line_count', jsonb_array_length(coalesce(new.line_items, '[]'::jsonb))
    )
  );

  return new;
end;
$$;

drop trigger if exists bi_events_delivery_notes_trigger on public.delivery_notes;
create trigger bi_events_delivery_notes_trigger
after insert or update on public.delivery_notes
for each row execute function public.trg_bi_events_for_delivery_notes();
