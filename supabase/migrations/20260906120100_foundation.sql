-- The pieces every other migration builds on: a private schema, the types that
-- make bad data impossible, and the admin gate.

-- Only `public` and `graphql_public` are exposed to PostgREST (config.toml),
-- so nothing in `private` has a URL. It is reachable from server code with the
-- service key, and from the admin through security definer functions that
-- check is_admin() first. RLS is still the boundary; this removes the surface
-- that would otherwise exist purely because `public` is the default.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to service_role;

-- The highest-value line in the schema. Slugs are URLs, and every slug column
-- uses this, so a broken link becomes impossible rather than unlikely, in one
-- place instead of in every `with check`.
do $$ begin
  create domain public.slug as text
    check (value ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(value) between 1 and 80);
exception when duplicate_object then null; end $$;

-- Enums where the set is genuinely closed. Where a set may grow (how someone
-- came by access, what state a message is in) a check constraint is used
-- instead, because widening one is an ALTER rather than a type change.
do $$ begin
  create type public.doc_status as enum ('draft', 'published', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.doc_collection as enum ('thread', 'channel', 'notebook_section');
exception when duplicate_object then null; end $$;

-- Who owns a row. A `sync` row is written by scripts/sync-notebooks.mjs from
-- the learnings repo; the editor must refuse to open one, because otherwise an
-- edit survives until the next sync and then silently disappears.
do $$ begin
  create type public.doc_origin as enum ('admin', 'sync');
exception when duplicate_object then null; end $$;

-- On every table, not on two of seven.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Who may edit.
--
-- Being able to sign in must never imply being an admin. "Allow new users to
-- sign up" is a global switch, not per provider, and the email provider is
-- enabled, so anyone in the world can obtain an account on this project. That
-- has to stay true: a student signing in with Google is a signup.
create table if not exists private.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  -- Costs one column now, saves a migration the first time someone should be
  -- able to write prose without being able to change the tree.
  role       text not null default 'admin' check (role in ('admin', 'editor')),
  added_by   uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists admins_set_updated_at on private.admins;
create trigger admins_set_updated_at
  before update on private.admins
  for each row execute function public.set_updated_at();

-- No client of any kind has a write path to this table, in any schema, under
-- any role short of the service key. An admin cannot promote anyone, including
-- themselves, and cannot demote a colleague. Promotion is a deliberate act.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = private, public
stable
as $$
  select exists (select 1 from private.admins where user_id = auth.uid());
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
