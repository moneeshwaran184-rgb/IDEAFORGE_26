begin;
alter table public.reports add column if not exists ai_priority text check(ai_priority in ('low','medium','high','critical'));
alter table public.reports add column if not exists ai_reason text;
alter table public.reports add column if not exists ai_state text not null default 'pending' check(ai_state in ('pending','processing','ready','failed'));
alter table public.reports add column if not exists ai_scored_at timestamptz;
alter table public.reports add column if not exists ai_model text;
alter table public.reports add column if not exists ai_attempts integer not null default 0;
alter table public.reports add column if not exists ai_started_at timestamptz;
-- Citizens cannot supply a fabricated AI assessment on insert.
create or replace function public.reset_ai_on_insert() returns trigger language plpgsql as $$
begin
 new.ai_priority:=null;new.ai_reason:=null;new.ai_state:='pending';new.ai_model:=null;
 new.ai_scored_at:=null;new.ai_attempts:=0;new.ai_started_at:=null;
 return new;
end; $$;
drop trigger if exists reset_ai_on_insert on public.reports;
create trigger reset_ai_on_insert before insert on public.reports for each row execute function public.reset_ai_on_insert();
-- Only the trusted Edge Function may write assessment fields.
create or replace function public.protect_ai_update() returns trigger language plpgsql as $$
begin
 if auth.role() is distinct from 'service_role' and
 (new.ai_priority,new.ai_reason,new.ai_state,new.ai_model,new.ai_scored_at,new.ai_attempts,new.ai_started_at)
 is distinct from
 (old.ai_priority,old.ai_reason,old.ai_state,old.ai_model,old.ai_scored_at,old.ai_attempts,old.ai_started_at)
 then raise exception 'AI assessment is server-managed'; end if;
 return new;
end; $$;
drop trigger if exists protect_ai_update on public.reports;
create trigger protect_ai_update before update on public.reports for each row execute function public.protect_ai_update();

create or replace function public.claim_ai_report(target text) returns boolean
language plpgsql security definer set search_path=public as $$
declare claimed text;
begin
 update reports set ai_state='processing',ai_attempts=ai_attempts+1,ai_started_at=now()
 where id=target and ai_state<>'ready' and ai_attempts<3
 and (ai_started_at is null or ai_started_at<now()-interval '2 minutes')
 returning id into claimed;
 return claimed is not null;
end; $$;
revoke all on function public.claim_ai_report(text) from public,anon,authenticated;
grant execute on function public.claim_ai_report(text) to service_role;
commit;
