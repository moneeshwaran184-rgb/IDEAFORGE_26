-- First run department-workflow.sql and create these users in Supabase Authentication.
begin;

insert into public.departments(id,name) values ('accessibility','Accessibility')
on conflict(id) do update set name=excluded.name;

-- Stop with a useful error instead of silently skipping accounts that do not exist.
do $$
declare missing text;
begin
  select string_agg(e.email, ', ') into missing
  from (values ('roads@example.com'),('electricity@example.com'),
    ('sanitation@example.com'),('water@example.com'),('parks@example.com'),
    ('accessibility@example.com'),('general@example.com')) as e(email)
  where not exists (select 1 from auth.users u where lower(u.email)=e.email);
  if missing is not null then
    raise exception 'Create these accounts in Authentication > Users first: %', missing;
  end if;
end $$;

insert into public.department_members(user_id,department_id)
select u.id, a.department_id
from (values
  ('roads@example.com','roads'),
  ('electricity@example.com','electricity'),
  ('sanitation@example.com','sanitation'),
  ('water@example.com','water'),
  ('parks@example.com','parks'),
  ('accessibility@example.com','accessibility'),
  ('general@example.com','general')
) as a(email,department_id)
join auth.users u on lower(u.email)=a.email
on conflict(user_id) do update set department_id=excluded.department_id;

create or replace function public.report_department(category text)
returns text language sql immutable set search_path=public as $$
select case category
  when 'roads-potholes' then 'roads'
  when 'accessibility' then 'accessibility'
  when 'streetlights' then 'electricity'
  when 'clean-energy' then 'electricity'
  when 'waste-sanitation' then 'sanitation'
  when 'waste-reduction' then 'sanitation'
  when 'water-drainage' then 'water'
  when 'public-transport' then 'transport'
  when 'transport-mobility' then 'transport'
  when 'parks-spaces' then 'parks'
  when 'noise' then 'safety'
  when 'public-safety' then 'safety'
  else 'general' end;
$$;

update public.reports set department_id='accessibility', assigned_department='Accessibility'
where category='accessibility' and status<>'resolved';

commit;

select u.email,d.name as department
from public.department_members m
join auth.users u on u.id=m.user_id
join public.departments d on d.id=m.department_id
order by d.name;
