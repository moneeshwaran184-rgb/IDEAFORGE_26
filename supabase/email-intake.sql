-- Apply LAST, after existing report, priority and super-admin migrations.
begin;
alter table public.admin_inbox add column if not exists mailbox text;
alter table public.admin_inbox add column if not exists message_id text;
alter table public.admin_inbox add column if not exists received_at timestamptz;
alter table public.admin_inbox add column if not exists processing_status text not null default 'pending' check(processing_status in ('pending','processing','accepted','rejected','failed'));
alter table public.admin_inbox add column if not exists reason text;
alter table public.admin_inbox add column if not exists department_id text references public.departments(id);
alter table public.admin_inbox add column if not exists report_id text references public.reports(id);
alter table public.admin_inbox add column if not exists updated_at timestamptz not null default now();
create unique index if not exists admin_inbox_message_key on public.admin_inbox(mailbox,message_id);
grant all on public.admin_inbox to service_role;
alter table public.reports add column if not exists source text not null default 'web';
-- Preserve every existing citizen check. Only the privileged atomic import may bypass it.
create or replace function public.prepare_citizen_report() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.source='email' then
   if auth.role() is distinct from 'service_role' or current_setting('app.email_import',true) is distinct from 'authorized' then
     raise exception 'Email imports require the privileged import function';
   end if;
   return new;
 end if;
if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'Citizen login required'; end if;
if exists(select 1 from department_members where user_id=auth.uid()) then raise exception 'Department accounts review reports only'; end if;
new.citizen_id:=auth.uid(); new.department_id:=report_department(new.category);
select name into new.assigned_department from departments where id=new.department_id;
new.status:='received'; new.votes:=0; new.resolution_summary:=null; new.acknowledged_at:=null;
new.created_at:=now(); new.updated_at:=now();
new.timeline:=jsonb_build_array(jsonb_build_object('id',gen_random_uuid(),'status','received','title','Received by '||new.assigned_department,'description','Sent to the responsible department for review.','date',now(),'actor','Citizen portal','department',new.assigned_department));
return new; end; $$;
create or replace function public.enforce_report_owner() returns trigger
language plpgsql security definer set search_path=public as $$
begin
 if new.source='email' then
   if auth.role() is distinct from 'service_role' or current_setting('app.email_import',true) is distinct from 'authorized' then
     raise exception 'Email imports require the privileged import function';
   end if;
   return new;
 end if;
 if auth.uid() is null then raise exception 'Login required'; end if;
 new.citizen_id:=auth.uid();
 return new;
end; $$;
create or replace function public.reset_ai_on_insert() returns trigger language plpgsql as $$
begin
 if new.source='email' then
   if auth.role() is distinct from 'service_role' or current_setting('app.email_import',true) is distinct from 'authorized' then
     raise exception 'Email imports require the privileged import function';
   end if;
   return new;
 end if;
 new.ai_priority:=null;new.ai_reason:=null;new.ai_state:='pending';new.ai_model:=null;
 new.ai_scored_at:=null;new.ai_attempts:=0;new.ai_started_at:=null;
 return new;
end; $$;
create or replace function public.apply_preflight_priority()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  a public.priority_assessments;
begin
 if new.source='email' then
   if auth.role() is distinct from 'service_role' or current_setting('app.email_import',true) is distinct from 'authorized' then
     raise exception 'Email imports require the privileged import function';
   end if;
   return new;
 end if;
  select * into a
  from public.priority_assessments
  where id = new.assessment_id
  for update;

  if a.id is null
     or a.user_id is distinct from auth.uid()
     or a.used
     or a.priority is null
     or a.created_at < now() - interval '1 hour'
     or a.report_type <> new.type
     or a.category <> new.category
     or a.title <> trim(new.title)
     or a.description <> trim(new.description) then
    raise exception 'Assess the current problem details before submitting (assessment expires after one hour).';
  end if;

  if new.type = 'complaint' then
    new.ai_priority := a.priority;
    new.ai_reason := a.reason;
    new.ai_state := 'ready';
    new.ai_model := 'gemini-3.5-flash-lite';
    new.ai_scored_at := a.created_at;
  else
    -- The suggestion assessment stores a neutral internal value only so the existing
    -- submission and duplicate-merge safeguards can validate the draft. Do not expose it.
    new.ai_priority := null;
    new.ai_reason := a.reason;
    new.ai_state := 'ready';
    new.ai_model := null;
    new.ai_scored_at := null;
  end if;

  update public.priority_assessments set used = true where id = a.id;
  return new;
end;
$$;

create or replace function public.finish_email_import(inbox_id uuid, verdict jsonb) returns jsonb
language plpgsql security definer set search_path=public as $$
declare mail public.admin_inbox; rid text; ref text; dept text; dept_name text; cat text;
begin
 if auth.role() is distinct from 'service_role' then raise exception 'Service access required'; end if;
 select * into mail from public.admin_inbox where id=inbox_id for update;
 if not found then raise exception 'Email not found'; end if;
 if mail.processing_status in ('accepted','rejected') then return jsonb_build_object('status',mail.processing_status,'reportId',mail.report_id); end if;
 if verdict->>'decision' not in ('accepted','rejected') or verdict->>'decision' is null then raise exception 'Invalid decision'; end if;
 if verdict->>'decision'='rejected' then
 update public.admin_inbox set processing_status='rejected',reason=left(verdict->>'reason',1000),updated_at=now() where id=inbox_id;
 return jsonb_build_object('status','rejected');
 end if;
 dept:=verdict->>'department';
 select name into dept_name from public.departments where id=dept;
 if dept_name is null or verdict->>'priority' not in ('low','medium','high','critical') or verdict->>'priority' is null then raise exception 'Invalid routing or priority'; end if;
 cat:=case dept when 'roads' then 'roads-potholes' when 'electricity' then 'streetlights' when 'water' then 'water-drainage' when 'sanitation' then 'waste-sanitation' when 'transport' then 'public-transport' when 'parks' then 'parks-spaces' when 'safety' then 'public-safety' when 'accessibility' then 'accessibility' else 'other' end;
 rid:=gen_random_uuid()::text; ref:='FMC-EMAIL-'||upper(replace(rid,'-',''));
 perform set_config('app.email_import','authorized',true);
 insert into public.reports(id,reference_number,type,category,title,description,location,status,contact_preference,citizen_id,department_id,assigned_department,source,votes,timeline,ai_priority,ai_reason,ai_state,ai_model,ai_scored_at)
 values(rid,ref,'complaint',cat,left(verdict->>'title',300),left(verdict->>'description',6000),jsonb_build_object('address',coalesce(nullif(verdict->>'location',''),'Location needs confirmation'),'area','Location needs confirmation','lat',null,'lng',null),'received','anonymous',null,dept,dept_name,'email',0,
 jsonb_build_array(jsonb_build_object('id',gen_random_uuid(),'status','received','title','Email complaint received','description','Assigned for department review. Confirm the location before dispatch.','date',now(),'actor','Email intake','department',dept_name)),verdict->>'priority',left(verdict->>'reason',1000),'ready','gemini-3.5-flash-lite',now());
 perform set_config('app.email_import','',true);
 update public.admin_inbox set processing_status='accepted',reason=left(verdict->>'reason',1000),department_id=dept,report_id=rid,updated_at=now() where id=inbox_id;
 return jsonb_build_object('status','accepted','reportId',rid,'reference',ref);
end; $$;
revoke all on function public.finish_email_import(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.finish_email_import(uuid,jsonb) to service_role;
commit;
