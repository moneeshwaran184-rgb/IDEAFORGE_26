-- Apply this after priority-before-submit.sql.
-- Suggestions are AI-checked for civic relevance, but never receive a priority score.
begin;

create or replace function public.apply_preflight_priority()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  a public.priority_assessments;
begin
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

update public.reports
set ai_priority = null,
    ai_model = null,
    ai_scored_at = null
where type = 'suggestion';

commit;
