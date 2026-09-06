-- Reading the inbox.
--
-- `private` is not exposed to PostgREST, so supabase-js cannot select from
-- private.inbox at all, with any key. That is the point: the table has no URL.
-- The admin needs to read it, so there is exactly one function that can, and it
-- checks is_admin() first.
--
-- security definer for the same reason is_admin() is: it reads a table the
-- caller has no privileges on. The explicit search_path is not optional; a
-- definer function without one lets the caller choose which schema `inbox`
-- resolves to.
create or replace function public.admin_inbox(p_status text default null)
returns table (
  id         uuid,
  kind       text,
  name       text,
  email      text,
  body       text,
  context    jsonb,
  status     text,
  created_at timestamptz,
  handled_at timestamptz
)
language plpgsql
security definer
set search_path = private, public
stable
as $$
begin
  -- Not `return empty`: an admin-only function that quietly returns nothing to
  -- a non-admin is indistinguishable from an empty inbox, and that is the kind
  -- of ambiguity that hides a broken gate for months.
  if not public.is_admin() then
    raise exception 'not an admin' using errcode = '42501';
  end if;

  return query
    select i.id, i.kind, i.name, i.email, i.body, i.context, i.status,
           i.created_at, i.handled_at
    from private.inbox i
    where p_status is null or i.status = p_status
    order by i.created_at desc;
end;
$$;

revoke execute on function public.admin_inbox(text) from public, anon;
grant execute on function public.admin_inbox(text) to authenticated;

-- Marking one handled. Same gate, same reasoning.
create or replace function public.admin_inbox_set_status(p_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = private, public
as $$
begin
  if not public.is_admin() then
    raise exception 'not an admin' using errcode = '42501';
  end if;

  update private.inbox
  set status     = p_status,
      handled_at = case when p_status = 'new' then null else now() end,
      handled_by = case when p_status = 'new' then null else auth.uid() end
  where id = p_id;
end;
$$;

revoke execute on function public.admin_inbox_set_status(uuid, text) from public, anon;
grant execute on function public.admin_inbox_set_status(uuid, text) to authenticated;
