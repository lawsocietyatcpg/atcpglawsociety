-- Shared website content. Only the server-side service credential may write it.
create table if not exists public.site_state (
  id smallint primary key check (id = 1),
  body jsonb not null,
  version bigint not null default 1,
  updated_at timestamptz not null default now()
);

create table if not exists public.site_revisions (
  id bigint generated always as identity primary key,
  action text not null,
  actor uuid references auth.users(id) on delete set null,
  body jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.site_state enable row level security;
alter table public.site_revisions enable row level security;
revoke all on public.site_state from anon, authenticated;
revoke all on public.site_revisions from anon, authenticated;
grant select, insert, update on public.site_state to service_role;
grant select, insert, delete on public.site_revisions to service_role;
grant usage, select on sequence public.site_revisions_id_seq to service_role;

create or replace function public.save_site_state(
  expected_version bigint, new_body jsonb, action_name text, actor_id uuid
) returns bigint language plpgsql security definer set search_path = '' as $$
declare previous record;
begin
  select body, version into previous from public.site_state where id = 1 for update;
  if previous.version is null or previous.version <> expected_version then
    raise exception 'version_conflict' using errcode = '40001';
  end if;
  insert into public.site_revisions (action, actor, body)
  values (action_name, actor_id, previous.body);
  update public.site_state
  set body = new_body, version = previous.version + 1, updated_at = now()
  where id = 1;
  delete from public.site_revisions where id not in (
    select id from public.site_revisions order by id desc limit 50
  );
  return previous.version + 1;
end;
$$;

revoke all on function public.save_site_state(bigint,jsonb,text,uuid) from public, anon, authenticated;
grant execute on function public.save_site_state(bigint,jsonb,text,uuid) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('society-public', 'society-public', true, 5000000,
  array['image/png','image/jpeg','image/webp','application/pdf'])
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('society-backups', 'society-backups', false, 50000000, array['application/zip'])
on conflict (id) do nothing;
