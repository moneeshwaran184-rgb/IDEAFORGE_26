-- Run in Supabase SQL Editor after department-workflow.sql.
-- New submissions are owned by the authenticated citizen, never by a supplied email.
begin;
alter table public.reports add column if not exists citizen_id uuid references auth.users(id);
alter table public.reports alter column citizen_id set default auth.uid();
create or replace function public.enforce_report_owner() returns trigger
language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null then raise exception 'Login required'; end if;
 new.citizen_id:=auth.uid();
 return new;
end; $$;
drop trigger if exists enforce_report_owner on public.reports;
create trigger enforce_report_owner before insert on public.reports
for each row execute function public.enforce_report_owner();
drop policy if exists "Read own reports" on public.reports;
create policy "Read own reports" on public.reports for select to authenticated using(citizen_id=auth.uid());
create index if not exists reports_citizen_created_idx on public.reports(citizen_id,created_at desc);
commit;

-- Diagnose older reports. Do not assign them to the current user automatically.
select reference_number,title,created_at,citizen_id
from public.reports where citizen_id is null order by created_at desc;
-- Only after verifying who submitted a specific report, the project owner can use:
-- update public.reports set citizen_id=(select id from auth.users where email='VERIFIED-CITIZEN-EMAIL')
-- where reference_number='EXACT-REPORT-REFERENCE' and citizen_id is null;
