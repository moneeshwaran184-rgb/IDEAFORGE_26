-- Shared demo EMAIL directory. Never store account passwords or session tokens here.
begin;
create table if not exists public.demo_profile_directory (
 email text primary key check(email = lower(trim(email)) and length(email) between 3 and 254),
 label text not null check(length(label) between 1 and 254),
 created_by uuid default auth.uid() references auth.users(id),
 created_at timestamptz not null default now()
);
-- A demo email is intentionally shared with every visitor, including logged-out visitors.
-- Never store passwords, auth tokens, or other private account data in this table.
alter table public.demo_profile_directory alter column created_by drop not null;
alter table public.demo_profile_directory enable row level security;
revoke all on public.demo_profile_directory from anon, authenticated;
grant select, insert on public.demo_profile_directory to anon, authenticated;
drop policy if exists "Signed in users see demo profiles" on public.demo_profile_directory;
drop policy if exists "Signed in users add demo profiles" on public.demo_profile_directory;
drop policy if exists "Visitors see shared demo profiles" on public.demo_profile_directory;
drop policy if exists "Visitors add shared demo profiles" on public.demo_profile_directory;
create policy "Visitors see shared demo profiles" on public.demo_profile_directory
 for select to anon, authenticated using (true);
create policy "Visitors add shared demo profiles" on public.demo_profile_directory
 for insert to anon, authenticated with check (created_by is null or created_by = auth.uid());
commit;
