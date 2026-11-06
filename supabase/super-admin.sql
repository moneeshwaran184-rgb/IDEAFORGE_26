begin;
create table if not exists public.super_admins(
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table public.super_admins enable row level security;
revoke all on public.super_admins from anon,authenticated;
grant select on public.super_admins to authenticated;
drop policy if exists "Super admin reads own role" on public.super_admins;
create policy "Super admin reads own role" on public.super_admins for select to authenticated using(user_id=auth.uid());
-- Email inbox scaffold only. Do not store mailbox passwords here.
create table if not exists public.admin_inbox(
 id uuid primary key default gen_random_uuid(),
 sender text not null, subject text not null, body text not null,
 created_at timestamptz not null default now(), read_at timestamptz
);
alter table public.admin_inbox enable row level security;
revoke all on public.admin_inbox from anon,authenticated;
grant select on public.admin_inbox to authenticated;
drop policy if exists "Super admins read inbox" on public.admin_inbox;
create policy "Super admins read inbox" on public.admin_inbox for select to authenticated
using(exists(select 1 from public.super_admins s where s.user_id=auth.uid()));
-- After creating admin@fixmycity.tn in Supabase Auth, promote it:
-- insert into public.super_admins(user_id)
-- select id from auth.users where lower(email)=lower('admin@fixmycity.tn')
-- on conflict do nothing;
commit;
