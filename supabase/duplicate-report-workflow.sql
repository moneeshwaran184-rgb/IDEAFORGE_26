-- Apply after department-workflow.sql and repair-citizen-workflow.sql.
-- Duplicate detection suggests a match; the citizen must choose whether to attach.
begin;

create table if not exists public.report_reporters (
  report_id text not null references public.reports(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  relationship text not null default 'attached' check (relationship in ('original', 'attached')),
  created_at timestamptz not null default now(),
  primary key (report_id, user_id)
);
alter table public.reports add column if not exists citizen_reporter_count integer not null default 1 check (citizen_reporter_count >= 1);

alter table public.report_reporters enable row level security;
revoke all on public.report_reporters from anon, authenticated;
grant select on public.report_reporters to authenticated;
drop policy if exists "Citizens read their report links" on public.report_reporters;
create policy "Citizens read their report links"
  on public.report_reporters for select to authenticated
  using (user_id = auth.uid());

create table if not exists public.duplicate_check_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.duplicate_check_attempts enable row level security;
revoke all on public.duplicate_check_attempts from anon, authenticated;
grant all on public.duplicate_check_attempts to service_role;

create or replace function public.claim_duplicate_check(target_user uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_count integer;
begin
  if auth.role() <> 'service_role' then return false; end if;
  perform pg_advisory_xact_lock(hashtext(target_user::text));
  delete from public.duplicate_check_attempts where created_at < now() - interval '1 day';
  select count(*) into v_count from public.duplicate_check_attempts
  where user_id = target_user and created_at > now() - interval '1 hour';
  if v_count >= 20 then return false; end if;
  insert into public.duplicate_check_attempts(user_id) values (target_user);
  return true;
end;
$$;
revoke all on function public.claim_duplicate_check(uuid) from public, anon, authenticated;
grant execute on function public.claim_duplicate_check(uuid) to service_role;

create or replace function public.add_original_reporter()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.citizen_id is not null then
    insert into public.report_reporters(report_id, user_id, relationship)
    values (new.id, new.citizen_id, 'original')
    on conflict (report_id, user_id) do nothing;
  end if;
  return new;
end;
$$;
drop trigger if exists add_original_reporter on public.reports;
create trigger add_original_reporter after insert on public.reports
for each row execute function public.add_original_reporter();

-- Backfill original reporters for existing reports.
insert into public.report_reporters(report_id, user_id, relationship)
select id, citizen_id, 'original' from public.reports where citizen_id is not null
on conflict (report_id, user_id) do nothing;
update public.reports r set citizen_reporter_count = (
  select greatest(1, count(*)::integer) from public.report_reporters rr where rr.report_id = r.id
) where r.citizen_id is not null;

drop policy if exists "Read linked reports" on public.reports;
create policy "Read linked reports" on public.reports for select to authenticated
using (
  exists (
    select 1 from public.report_reporters rr
    where rr.report_id = reports.id and rr.user_id = auth.uid()
  )
);

create or replace function public.attach_to_existing_report(
  target_report_id text,
  expected_category text,
  submitted_lat double precision,
  submitted_lng double precision
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_report public.reports;
  v_distance double precision;
  v_inserted integer;
begin
  if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then
    raise exception 'Log in before attaching to an existing issue';
  end if;
  if exists (select 1 from public.department_members where user_id = auth.uid()) then
    raise exception 'Department accounts cannot attach citizen reports';
  end if;
  if submitted_lat not between 8 and 13.6 or submitted_lng not between 76.2 and 80.4 then
    raise exception 'Choose a location in Tamil Nadu';
  end if;

  select * into v_report from public.reports where id = target_report_id for update;
  if v_report.id is null then raise exception 'The suggested report no longer exists'; end if;
  if v_report.citizen_id = auth.uid() then raise exception 'This is already your report'; end if;
  if v_report.category is distinct from expected_category then raise exception 'The report category no longer matches'; end if;
  if v_report.status = 'resolved' then raise exception 'This issue is already completed'; end if;
  if (v_report.location->>'lat') is null or (v_report.location->>'lng') is null then
    raise exception 'The existing report has no usable map location';
  end if;

  v_distance := 6371000 * acos(least(1, greatest(-1,
    cos(radians(submitted_lat)) * cos(radians((v_report.location->>'lat')::double precision)) *
    cos(radians((v_report.location->>'lng')::double precision) - radians(submitted_lng)) +
    sin(radians(submitted_lat)) * sin(radians((v_report.location->>'lat')::double precision))
  )));
  if v_distance > 350 then raise exception 'The selected issue is too far from this location to attach'; end if;

  insert into public.report_reporters(report_id, user_id, relationship)
  values (v_report.id, auth.uid(), 'attached')
  on conflict (report_id, user_id) do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted > 0 then
    update public.reports set citizen_reporter_count = citizen_reporter_count + 1 where id = v_report.id;
  end if;
end;
$$;
revoke all on function public.attach_to_existing_report(text, text, double precision, double precision) from public, anon;
grant execute on function public.attach_to_existing_report(text, text, double precision, double precision) to authenticated;

-- Citizens attached to an existing report receive the same status updates as its original reporter.
create or replace function public.notify_attached_reporters()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_event text;
  v_message text;
  v_reporter record;
begin
  if new.status is not distinct from old.status
     and new.acknowledged_at is not distinct from old.acknowledged_at then
    return new;
  end if;

  if new.status = 'resolved' and old.status is distinct from new.status then
    v_event := 'Completed';
    v_message := new.reference_number || ': Completed by ' || coalesce(new.assigned_department, 'the department') || '. ' || coalesce(new.resolution_summary, '');
  elsif new.acknowledged_at is not null and old.acknowledged_at is distinct from new.acknowledged_at then
    v_event := 'Suggestion acknowledged';
    v_message := new.reference_number || ': Your suggestion has been acknowledged.';
  else
    v_event := 'Status update';
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
