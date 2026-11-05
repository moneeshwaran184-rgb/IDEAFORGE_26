begin;
create table if not exists public.departments(id text primary key, name text not null);
insert into public.departments values ('roads','Roads & Highways'),('electricity','Lighting & Energy'),('sanitation','Sanitation'),('water','Water & Drainage'),('transport','Transport'),('parks','Parks & Public Spaces'),('safety','Public Safety'),('general','Municipal Services') on conflict do nothing;
create table if not exists public.department_members(user_id uuid primary key references auth.users(id) on delete cascade,department_id text not null references public.departments(id));
alter table public.departments enable row level security;
alter table public.department_members enable row level security;
drop policy if exists "Read departments" on public.departments;
create policy "Read departments" on public.departments for select using(true);
drop policy if exists "Own membership" on public.department_members;
create policy "Own membership" on public.department_members for select to authenticated using(user_id=auth.uid());
revoke all on public.department_members from anon,authenticated;
grant select on public.department_members to authenticated;
grant select on public.departments to anon,authenticated;
create or replace function public.report_department(category text) returns text language sql immutable set search_path=public as $$
select case category when 'roads-potholes' then 'roads' when 'accessibility' then 'roads' when 'streetlights' then 'electricity' when 'clean-energy' then 'electricity' when 'waste-sanitation' then 'sanitation' when 'waste-reduction' then 'sanitation' when 'water-drainage' then 'water' when 'public-transport' then 'transport' when 'transport-mobility' then 'transport' when 'parks-spaces' then 'parks' when 'noise' then 'safety' when 'public-safety' then 'safety' else 'general' end;
$$;
alter table public.reports add column if not exists citizen_id uuid references auth.users(id);
alter table public.reports add column if not exists department_id text references public.departments(id);
alter table public.reports add column if not exists acknowledged_at timestamptz;
update public.reports set department_id=public.report_department(category) where department_id is null;
update public.reports r set assigned_department=d.name from public.departments d where r.department_id=d.id and r.assigned_department is distinct from d.name;
create table if not exists public.citizen_notifications(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,report_id text not null references public.reports(id) on delete cascade,message text not null,created_at timestamptz not null default now(),read_at timestamptz);
alter table public.citizen_notifications enable row level security;
drop policy if exists "Own notifications" on public.citizen_notifications;
create policy "Own notifications" on public.citizen_notifications for select to authenticated using(user_id=auth.uid());
drop policy if exists "Read notification" on public.citizen_notifications;
create policy "Read notification" on public.citizen_notifications for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
revoke all on public.citizen_notifications from anon,authenticated;
grant select on public.citizen_notifications to authenticated;
grant update(read_at) on public.citizen_notifications to authenticated;
create or replace function public.prepare_citizen_report() returns trigger language plpgsql security definer set search_path=public as $$
begin
if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'Citizen login required'; end if;
if exists(select 1 from department_members where user_id=auth.uid()) then raise exception 'Department accounts review reports only'; end if;
new.citizen_id:=auth.uid(); new.department_id:=report_department(new.category);
select name into new.assigned_department from departments where id=new.department_id;
new.status:='received'; new.votes:=0; new.resolution_summary:=null; new.acknowledged_at:=null;
new.created_at:=now(); new.updated_at:=now();
new.timeline:=jsonb_build_array(jsonb_build_object('id',gen_random_uuid(),'status','received','title','Received by '||new.assigned_department,'description','Sent to the responsible department for review.','date',now(),'actor','Citizen portal','department',new.assigned_department));
return new; end; $$;
drop trigger if exists prepare_citizen_report on public.reports;
create trigger prepare_citizen_report before insert on public.reports for each row execute function public.prepare_citizen_report();
do $$ declare p record; begin
for p in select policyname from pg_policies where schemaname='public' and tablename='reports' and cmd in ('INSERT','UPDATE','DELETE','ALL')
loop execute format('drop policy %I on public.reports',p.policyname); end loop; end $$;
alter table public.reports enable row level security;
revoke insert,update,delete on public.reports from anon,authenticated;
grant insert,select on public.reports to authenticated;
grant select on public.reports to anon;
create policy "Citizen submissions" on public.reports for insert to authenticated with check(citizen_id=auth.uid() and not exists(select 1 from public.department_members where user_id=auth.uid()));
create or replace function public.review_report(
  report_id text, action text, note text default ''
) returns void
language plpgsql security definer set search_path=public as $$
declare
  v_report public.reports;
  v_department text;
  v_status text;
  v_event_title text;
  v_note text := trim(coalesce(review_report.note, ''));
begin
  select dm.department_id into v_department
  from public.department_members as dm where dm.user_id=auth.uid();

  select rp.* into v_report from public.reports as rp
  where rp.id=review_report.report_id for update;

  if v_department is null or v_report.id is null
     or v_report.department_id is distinct from v_department then
    raise exception 'Not authorized for this department';
  end if;
  if v_report.status='resolved' then raise exception 'Already completed'; end if;
  if length(v_note)<5 then
    raise exception 'Enter a review note (at least 5 characters)';
  end if;

  if review_report.action='acknowledge' and v_report.type='suggestion'
     and v_report.acknowledged_at is null and v_report.status='received' then
    v_event_title:='Suggestion acknowledged'; v_status:='under_review';
  elsif review_report.action='review' and v_report.status='received' then
    v_event_title:='Department review started'; v_status:='under_review';
  elsif review_report.action='progress' and v_report.status in ('under_review','assigned') then
    v_event_title:='Work started'; v_status:='in_progress';
  elsif review_report.action='complete' and v_report.status in ('under_review','assigned','in_progress') then
    v_event_title:='Completed'; v_status:='resolved';
  else
    raise exception 'Invalid action for current status';
  end if;

  update public.reports as rp
  set status=v_status, updated_at=now(),
      acknowledged_at=case when review_report.action='acknowledge' then now() else rp.acknowledged_at end,
      resolution_summary=case when review_report.action='complete' then v_note else rp.resolution_summary end,
      timeline=coalesce(rp.timeline,'[]'::jsonb)||jsonb_build_array(jsonb_build_object(
        'id',gen_random_uuid(),'status',v_status,'title',v_event_title,
        'description',v_note,'date',now(),'actor',v_report.assigned_department,
        'department',v_report.assigned_department))
  where rp.id=review_report.report_id;

  if v_report.citizen_id is not null then
    insert into public.citizen_notifications(user_id,report_id,message)
    values(v_report.citizen_id,v_report.id,
      v_report.reference_number||': '||v_event_title||' by '||
      v_report.assigned_department||'. '||v_note);
  end if;
end;
$$;
revoke all on function public.review_report(text,text,text) from public,anon;
grant execute on function public.review_report(text,text,text) to authenticated;
create table if not exists public.report_votes(report_id text references public.reports(id) on delete cascade,user_id uuid references auth.users(id) on delete cascade,primary key(report_id,user_id));
alter table public.report_votes enable row level security;
revoke all on public.report_votes from anon,authenticated;
create or replace function public.toggle_report_vote(target_id text) returns jsonb language plpgsql security definer set search_path=public as $$
declare voted boolean; total integer; begin
if auth.uid() is null then raise exception 'Log in to vote'; end if;
perform 1 from reports where id=target_id for update;
if not found then raise exception 'Report not found'; end if;
if exists(select 1 from report_votes where report_id=target_id and user_id=auth.uid()) then delete from report_votes where report_id=target_id and user_id=auth.uid(); voted:=false;
else insert into report_votes values(target_id,auth.uid()); voted:=true; end if;
select count(*) into total from report_votes where report_id=target_id;
update reports set votes=total where id=target_id;
return jsonb_build_object('votes',total,'userVoted',voted); end; $$;
revoke all on function public.toggle_report_vote(text) from public,anon;
grant execute on function public.toggle_report_vote(text) to authenticated;
commit;

