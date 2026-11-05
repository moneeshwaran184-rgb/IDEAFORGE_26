-- Run this entire file in Supabase > SQL Editor.
-- Replaces only the review function; reports and accounts are preserved.
begin;
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
commit;
