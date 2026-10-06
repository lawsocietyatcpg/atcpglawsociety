-- Member records belong to Supabase Auth users. Apply through a reviewed migration.
-- Do not store passwords or OAuth secrets in these tables.

create table if not exists public.society_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now()
);

create table if not exists public.member_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 2 and 160),
  intake text not null check (char_length(trim(intake)) between 2 and 120),
  email text not null check (char_length(trim(email)) between 3 and 254),
  phone text not null check (char_length(trim(phone)) between 5 and 40),
  display_name text not null check (char_length(trim(display_name)) between 2 and 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- This is an internal retry queue. It is never readable from the public website.
create table if not exists public.member_sheet_queue (
  user_id uuid primary key references public.member_profiles(user_id) on delete cascade,
  version bigint not null default 1,
  synced_version bigint not null default 0,
  pending boolean generated always as (version > synced_version) stored,
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  last_error text,
  updated_at timestamptz not null default now()
);

create table if not exists public.member_sheet_sync_lock (
  id smallint primary key check (id = 1),
  holder uuid,
  lease_until timestamptz not null default '-infinity'
);
insert into public.member_sheet_sync_lock (id) values (1) on conflict do nothing;

create or replace function public.member_profile_before_write()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.full_name := trim(new.full_name);
  new.intake := trim(new.intake);
  new.email := lower(trim(new.email));
  new.phone := trim(new.phone);
  new.display_name := trim(new.display_name);
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists member_profile_before_write on public.member_profiles;
create trigger member_profile_before_write
before insert or update on public.member_profiles
for each row execute function public.member_profile_before_write();

create or replace function public.queue_member_sheet_sync()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.member_sheet_queue (user_id)
  values (new.user_id)
  on conflict (user_id) do update
    set version = public.member_sheet_queue.version + 1,
        attempts = 0,
        next_attempt_at = now(),
        last_error = null,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists queue_member_sheet_sync on public.member_profiles;
create trigger queue_member_sheet_sync
after insert or update on public.member_profiles
for each row execute function public.queue_member_sheet_sync();

alter table public.society_admins enable row level security;
alter table public.member_profiles enable row level security;
alter table public.member_sheet_queue enable row level security;
alter table public.member_sheet_sync_lock enable row level security;

revoke all on public.society_admins from anon, authenticated;
revoke all on public.member_profiles from anon, authenticated;
revoke all on public.member_sheet_queue from anon, authenticated;
revoke all on public.member_sheet_sync_lock from anon, authenticated;

grant select on public.society_admins to authenticated;
grant select on public.member_profiles to authenticated;
grant insert (user_id, full_name, intake, email, phone, display_name)
  on public.member_profiles to authenticated;
grant update (full_name, intake, phone, display_name)
  on public.member_profiles to authenticated;
grant select, insert, delete on public.society_admins to service_role;
grant select, insert, update, delete on public.member_profiles to service_role;
grant select, insert, update, delete on public.member_sheet_queue to service_role;
grant select, update on public.member_sheet_sync_lock to service_role;

create or replace function public.claim_member_sheet_sync(lease_holder uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare affected integer;
begin
  update public.member_sheet_sync_lock
  set holder = lease_holder, lease_until = now() + interval '90 seconds'
  where id = 1 and lease_until < now();
  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;

create or replace function public.release_member_sheet_sync(lease_holder uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.member_sheet_sync_lock
  set holder = null, lease_until = '-infinity'
  where id = 1 and holder = lease_holder;
end;
$$;

revoke all on function public.claim_member_sheet_sync(uuid) from public, anon, authenticated;
revoke all on function public.release_member_sheet_sync(uuid) from public, anon, authenticated;
grant execute on function public.claim_member_sheet_sync(uuid) to service_role;
grant execute on function public.release_member_sheet_sync(uuid) to service_role;

drop policy if exists "Read own admin membership" on public.society_admins;
create policy "Read own admin membership" on public.society_admins
for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Read own profile or society admin" on public.member_profiles;
create policy "Read own profile or society admin" on public.member_profiles
for select to authenticated using (
  user_id = (select auth.uid()) or exists (
    select 1 from public.society_admins a where a.user_id = (select auth.uid())
  )
);

drop policy if exists "Register own profile" on public.member_profiles;
create policy "Register own profile" on public.member_profiles
for insert to authenticated with check (
  user_id = (select auth.uid())
  and email = (select auth.jwt() ->> 'email')
);

drop policy if exists "Update own profile" on public.member_profiles;
create policy "Update own profile" on public.member_profiles
for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and email = (select auth.jwt() ->> 'email')
);

-- No client policy or grant exists for member_sheet_queue. Its writer will use
-- a server-side credential kept in Vercel, never in browser code or GitHub.
