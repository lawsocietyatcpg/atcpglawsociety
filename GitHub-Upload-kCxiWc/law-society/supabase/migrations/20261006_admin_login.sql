-- Shared administrator username/password, bootstrapped by the official Google account.
-- Password digests and sessions are never exposed through the browser Data API.
create table if not exists public.admin_credentials (
  id smallint primary key check (id = 1),
  owner_id uuid not null references auth.users(id) on delete restrict,
  username text not null,
  salt text not null,
  digest text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_sessions (
  token_hash text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  username text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_login_attempts (
  id bigint generated always as identity primary key,
  attempted_at timestamptz not null default now()
);
create index if not exists admin_login_attempts_time on public.admin_login_attempts(attempted_at);

alter table public.admin_credentials enable row level security;
alter table public.admin_sessions enable row level security;
alter table public.admin_login_attempts enable row level security;
revoke all on public.admin_credentials from anon, authenticated;
revoke all on public.admin_sessions from anon, authenticated;
revoke all on public.admin_login_attempts from anon, authenticated;
grant select, insert, update on public.admin_credentials to service_role;
grant select, insert, delete on public.admin_sessions to service_role;
grant select, insert, delete on public.admin_login_attempts to service_role;
grant usage, select on sequence public.admin_login_attempts_id_seq to service_role;
