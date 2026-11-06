-- Apply after ai-priority.sql, department-workflow.sql, and repair-citizen-workflow.sql.
-- validate-suggestion calls the service-role-only merge RPC after Gemini confirms a match.
begin;

create table if not exists public.report_reporters (
  report_id text not null references public.reports(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  relationship text not null default 'attached' check (relationship in ('original', 'attached')),
  created_at timestamptz not null default now(),
  primary key (report_id, user_id)
);
alter table public.report_reporters enable row level security;
revoke all on public.report_reporters from anon, authenticated;
grant select on public.report_reporters to authenticated;
drop policy if exists "Citizens read their report links" on public.report_reporters;
create policy "Citizens read their report links" on public.report_reporters
  for select to authenticated using (user_id = auth.uid());

alter table public.reports add column if not exists citizen_reporter_count integer not null default 1;
alter table public.priority_assessments add column if not exists attached_to text references public.reports(id) on delete set null;

create or replace function public.add_original_reporter()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.citizen_id is not null then
    insert into public.report_reporters(report_id, user_id, relationship)
    values (new.id, new.citizen_id, 'original') on conflict (report_id, user_id) do nothing;
  end if;
  return new;
end;
$$;
drop trigger if exists add_original_reporter on public.reports;
create trigger add_original_reporter after insert on public.reports
  for each row execute function public.add_original_reporter();

insert into public.report_reporters(report_id, user_id, relationship)
select id, citizen_id, 'original' from public.reports where citizen_id is not null
on conflict (report_id, user_id) do nothing;
update public.reports r set citizen_reporter_count = greatest(1, (
  select count(*)::integer from public.report_reporters rr where rr.report_id = r.id
));

create or replace function public.merge_assessed_suggestion(
  target_report_id text,
  citizen_id uuid,
  draft_id uuid
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_draft public.priority_assessments;
  v_report public.reports;
begin
  if auth.role() <> 'service_role' then raise exception 'Service role required'; end if;
  if citizen_id is null or exists(select 1 from public.department_members where user_id = citizen_id) then
    raise exception 'Citizen account required';
  end if;

  select * into v_draft from public.priority_assessments where id = draft_id for update;
  if v_draft.id is null or v_draft.user_id is distinct from citizen_id
     or v_draft.report_type <> 'suggestion' or v_draft.priority is null
     or v_draft.used or v_draft.created_at < now() - interval '1 hour' then
    raise exception 'Assess the current suggestion before merging';
  end if;

  perform pg_advisory_xact_lock(hashtext(target_report_id));
  select * into v_report from public.reports where id = target_report_id for update;
  if v_report.id is null or v_report.type <> 'suggestion'
     or v_report.status not in ('received', 'under_review', 'assigned', 'in_progress')
     or v_report.department_id is distinct from public.report_department(v_draft.category) then
    raise exception 'The matching suggestion is no longer open';
  end if;

  insert into public.report_reporters(report_id, user_id, relationship)
  values (v_report.id, citizen_id, 'attached') on conflict (report_id, user_id) do nothing;
  update public.reports set citizen_reporter_count = greatest(1, (
    select count(*)::integer from public.report_reporters rr where rr.report_id = v_report.id
  )) where id = v_report.id;
  update public.priority_assessments set used = true, attached_to = v_report.id where id = v_draft.id;
  return v_report.id;
end;
$$;
revoke all on function public.merge_assessed_suggestion(text, uuid, uuid) from public, anon, authenticated;
grant execute on function public.merge_assessed_suggestion(text, uuid, uuid) to service_role;

-- Linked citizens receive acknowledgement/progress/completion notifications from the shared item.
create or replace function public.notify_attached_reporters()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_message text;
  v_reporter record;
begin
  if new.status is not distinct from old.status
     and new.acknowledged_at is not distinct from old.acknowledged_at then return new; end if;
  if new.status = 'resolved' and old.status is distinct from new.status then
    v_message := new.reference_number || ': Completed by ' || coalesce(new.assigned_department, 'the department') || '. ' || coalesce(new.resolution_summary, '');
  elsif new.acknowledged_at is not null and old.acknowledged_at is distinct from new.acknowledged_at then
    v_message := new.reference_number || ': Your suggestion has been acknowledged.';
  else
    v_message := new.reference_number || ': Status changed to ' || replace(new.status, '_', ' ') || '.';
  end if;
  for v_reporter in
    select rr.user_id from public.report_reporters rr
    where rr.report_id = new.id and rr.user_id <> coalesce(new.citizen_id, '00000000-0000-0000-0000-000000000000'::uuid)
  loop
    insert into public.citizen_notifications(user_id, report_id, message)
    values (v_reporter.user_id, new.id, v_message);
  end loop;
  return new;
end;
$$;
drop trigger if exists notify_attached_reporters on public.reports;
create trigger notify_attached_reporters after update on public.reports
  for each row execute function public.notify_attached_reporters();

commit;
