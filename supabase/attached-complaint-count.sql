begin;
alter table public.reports add column if not exists attached_report_count integer;
update public.reports r set attached_report_count =
 (select count(*) from public.report_reporters rr where rr.report_id=r.id and rr.relationship='attached')
where attached_report_count is null;
alter table public.reports alter column attached_report_count set default 0,
 alter column attached_report_count set not null;
alter table public.priority_assessments add column if not exists attached_to text references public.reports(id) on delete set null;

create or replace function public.attach_assessed_complaint(target_report_id text, draft_id uuid,
 expected_category text, submitted_lat double precision, submitted_lng double precision)
returns void language plpgsql security definer set search_path=public as $$
declare
 draft public.priority_assessments;
 ticket public.reports;
begin
 select * into draft from priority_assessments where id=draft_id for update;
 if auth.uid() is null or draft.user_id is distinct from auth.uid() or draft.id is null
 or draft.report_type <> 'complaint' or draft.category is distinct from expected_category
 or draft.priority is null then raise exception 'Assess this complaint first'; end if;
 if draft.used and draft.attached_to=target_report_id then return; end if;
 if draft.used or draft.created_at < now()-interval '1 hour' then raise exception 'Refresh the priority assessment'; end if;
 select * into ticket from reports where id=target_report_id for update;
 if ticket.id is null or ticket.type <> 'complaint' or ticket.status='resolved'
 or ticket.category is distinct from expected_category or submitted_lat is null or submitted_lng is null
 then raise exception 'This ticket is no longer a matching open complaint'; end if;
 if ticket.citizen_id is distinct from auth.uid() then
   perform public.attach_to_existing_report(target_report_id,expected_category,submitted_lat,submitted_lng);
 else
   if not (submitted_lat between 8 and 13.6 and submitted_lng between 76.2 and 80.4)
   or ticket.location->>'lat' is null or ticket.location->>'lng' is null
   or 6371000 * acos(least(1,greatest(-1,
   cos(radians(submitted_lat))*cos(radians((ticket.location->>'lat')::float8))*
   cos(radians((ticket.location->>'lng')::float8-submitted_lng))+
   sin(radians(submitted_lat))*sin(radians((ticket.location->>'lat')::float8))))) > 350
   then raise exception 'Select a matching nearby complaint'; end if;
 end if;
 update reports set attached_report_count=attached_report_count+1 where id=ticket.id;
 update priority_assessments set used=true,attached_to=ticket.id where id=draft.id;
end;
$$;
revoke all on function public.attach_assessed_complaint(text,uuid,text,float8,float8) from public,anon;
grant execute on function public.attach_assessed_complaint(text,uuid,text,float8,float8) to authenticated;
commit;
