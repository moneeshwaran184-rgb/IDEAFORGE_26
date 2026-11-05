begin;
create table if not exists public.priority_assessments(
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id),
 report_type text not null, category text not null, title text not null, description text not null,
 priority text check(priority in ('low','medium','high','critical')), reason text,
 created_at timestamptz not null default now(), used boolean not null default false
);
alter table public.priority_assessments enable row level security;
revoke all on public.priority_assessments from anon,authenticated;
grant all on public.priority_assessments to service_role;
alter table public.reports add column if not exists assessment_id uuid references public.priority_assessments(id);

create or replace function public.apply_preflight_priority() returns trigger
language plpgsql security definer set search_path=public as $$
declare a public.priority_assessments;
begin
 select * into a from public.priority_assessments where id=new.assessment_id for update;
 if a.id is null or a.user_id is distinct from auth.uid() or a.used or a.priority is null
 or a.created_at<now()-interval '1 hour' or a.report_type<>new.type or a.category<>new.category
 or a.title<>trim(new.title) or a.description<>trim(new.description)
 then raise exception 'Assess the current problem details before submitting (assessment expires after one hour).'; end if;
 new.ai_priority:=a.priority;new.ai_reason:=a.reason;new.ai_state:='ready';
 new.ai_model:='gemini-3.5-flash-lite';new.ai_scored_at:=a.created_at;
 update public.priority_assessments set used=true where id=a.id;
 return new;
end; $$;
-- Runs after reset_ai_on_insert by trigger name order.
drop trigger if exists zz_apply_preflight_priority on public.reports;
create trigger zz_apply_preflight_priority before insert on public.reports
for each row execute function public.apply_preflight_priority();
commit;
