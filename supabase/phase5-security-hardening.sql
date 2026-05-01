create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists client_id text;

alter table public.message_attachments
  add column if not exists storage_path text,
  add column if not exists public_url text,
  add column if not exists mime_type text;

create or replace function public.current_profile()
returns public.profiles
language sql
stable
security definer
set search_path = public
as $$
  select p.*
  from public.profiles p
  where p.id = auth.uid()
  limit 1
$$;

create or replace function public.is_internal_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select public.current_profile().account_type <> 'client'), false)
$$;

create or replace function public.can_access_conversation(target_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = target_conversation_id
      and cp.user_id = auth.uid()
  )
$$;

create or replace function public.can_access_job(target_job_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_internal_user()
    or exists (
      select 1
      from public.jobs j
      join public.profiles p on p.id = auth.uid()
      where j.id = target_job_id
        and p.account_type = 'client'
        and p.client_id is not null
        and p.client_id = j.client_id
    )
$$;

create or replace function public.can_access_attachment(target_attachment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.message_attachments ma
    join public.messages m on m.id = ma.message_id
    where ma.id = target_attachment_id
      and public.can_access_conversation(m.conversation_id)
  )
$$;

create or replace function public.submit_client_job_approval(
  target_job_id text,
  approval_decision text,
  approval_note text,
  actor_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_row public.profiles;
begin
  profile_row := public.current_profile();

  if profile_row.id is null then
    raise exception 'No authenticated profile found';
  end if;

  if profile_row.account_type <> 'client' then
    raise exception 'Only client accounts can use this approval path';
  end if;

  if not exists (
    select 1
    from public.jobs j
    where j.id = target_job_id
      and j.client_id = profile_row.client_id
  ) then
    raise exception 'You cannot approve this job';
  end if;

  if approval_decision = 'approved' then
    update public.jobs
    set
      approval_status = 'Approved',
      final_approval_received_date = current_date,
      final_approval_cleared_by = actor_name,
      changes_requested = approval_note
    where id = target_job_id;
  elsif approval_decision = 'changes_requested' then
    update public.jobs
    set
      approval_status = 'Changes Requested',
      final_approval_received_date = null,
      final_approval_cleared_by = null,
      changes_requested = approval_note
    where id = target_job_id;
  else
    raise exception 'Unsupported approval decision';
  end if;
end;
$$;

revoke all on function public.current_profile() from public;
grant execute on function public.current_profile() to authenticated;

revoke all on function public.is_internal_user() from public;
grant execute on function public.is_internal_user() to authenticated;

revoke all on function public.can_access_conversation(uuid) from public;
grant execute on function public.can_access_conversation(uuid) to authenticated;

revoke all on function public.can_access_job(text) from public;
grant execute on function public.can_access_job(text) to authenticated;

revoke all on function public.can_access_attachment(uuid) from public;
grant execute on function public.can_access_attachment(uuid) to authenticated;

revoke all on function public.submit_client_job_approval(text, text, text, text) from public;
grant execute on function public.submit_client_job_approval(text, text, text, text) to authenticated;

alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.message_attachments enable row level security;
alter table public.jobs enable row level security;

drop policy if exists "profiles_select_secure" on public.profiles;
create policy "profiles_select_secure"
on public.profiles for select
to authenticated
using (
  id = auth.uid()
  or public.is_internal_user()
);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = auth.uid() or public.is_internal_user())
with check (id = auth.uid() or public.is_internal_user());

drop policy if exists "conversations_select_secure" on public.conversations;
create policy "conversations_select_secure"
on public.conversations for select
to authenticated
using (public.can_access_conversation(id));

drop policy if exists "conversations_insert_internal" on public.conversations;
create policy "conversations_insert_internal"
on public.conversations for insert
to authenticated
with check (public.is_internal_user());

drop policy if exists "conversations_update_internal" on public.conversations;
create policy "conversations_update_internal"
on public.conversations for update
to authenticated
using (public.is_internal_user() and public.can_access_conversation(id))
with check (public.is_internal_user() and public.can_access_conversation(id));

drop policy if exists "participants_select_secure" on public.conversation_participants;
create policy "participants_select_secure"
on public.conversation_participants for select
to authenticated
using (public.can_access_conversation(conversation_id));

drop policy if exists "participants_manage_internal" on public.conversation_participants;
create policy "participants_manage_internal"
on public.conversation_participants for all
to authenticated
using (public.is_internal_user() and public.can_access_conversation(conversation_id))
with check (public.is_internal_user());

drop policy if exists "messages_select_secure" on public.messages;
create policy "messages_select_secure"
on public.messages for select
to authenticated
using (public.can_access_conversation(conversation_id));

drop policy if exists "messages_insert_secure" on public.messages;
create policy "messages_insert_secure"
on public.messages for insert
to authenticated
with check (
  sender_user_id = auth.uid()
  and public.can_access_conversation(conversation_id)
);

drop policy if exists "messages_update_internal" on public.messages;
create policy "messages_update_internal"
on public.messages for update
to authenticated
using (public.is_internal_user() and public.can_access_conversation(conversation_id))
with check (public.is_internal_user() and public.can_access_conversation(conversation_id));

drop policy if exists "attachments_select_secure" on public.message_attachments;
create policy "attachments_select_secure"
on public.message_attachments for select
to authenticated
using (public.can_access_attachment(id));

drop policy if exists "attachments_insert_secure" on public.message_attachments;
create policy "attachments_insert_secure"
on public.message_attachments for insert
to authenticated
with check (
  exists (
    select 1
    from public.messages m
    where m.id = message_id
      and m.sender_user_id = auth.uid()
      and public.can_access_conversation(m.conversation_id)
  )
);

drop policy if exists "jobs_select_secure" on public.jobs;
create policy "jobs_select_secure"
on public.jobs for select
to authenticated
using (public.can_access_job(id));

drop policy if exists "jobs_update_internal_only" on public.jobs;
create policy "jobs_update_internal_only"
on public.jobs for update
to authenticated
using (public.is_internal_user())
with check (public.is_internal_user());

insert into storage.buckets (id, name, public)
values ('message-attachments', 'message-attachments', true)
on conflict (id) do nothing;

drop policy if exists "message_attachments_read" on storage.objects;
create policy "message_attachments_read"
on storage.objects for select
to authenticated
using (bucket_id = 'message-attachments');

drop policy if exists "message_attachments_insert" on storage.objects;
create policy "message_attachments_insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'message-attachments');
