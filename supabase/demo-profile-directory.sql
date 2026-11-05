-- Shared demo EMAIL directory. Never store account passwords or session tokens here.
begin;
create table if not exists public.demo_profile_directory (
 email text primary key check(email = lower(trim(email)) and length(email) between 3 and 254),
 label text not null check(length(label) between 1 and 254),
 created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now()
);
alter table public.demo_profile_directory enable row level security;
revoke all on public.demo_profile_directory from anon, authenticated;
grant select, insert on public.demo_profile_directory to authenticated;
drop policy if exists "Signed in users see demo profiles" on public.demo_profile_directory;
create policy "Signed in users see demo profiles" on public.demo_profile_directory
 for select to authenticated using (true);
drop policy if exists "Signed in users add demo profiles" on public.demo_profile_directory;
create policy "Signed in users add demo profiles" on public.demo_profile_directory
 for insert to authenticated with check (created_by = auth.uid());
commit;
