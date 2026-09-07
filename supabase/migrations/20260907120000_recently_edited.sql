-- What a person has actually changed.
--
-- The admin's overview listed "last edited" by ordering documents on
-- updated_at, which showed eight arbitrary channels, because the one-way sync
-- from git stamped all 93 within the same second. Filtering on
-- `updated_at > created_at + 1s` narrowed it and was still a guess: rows whose
-- timestamps happened to drift past a second during the import looked edited.
--
-- The revisions table already knows the answer exactly. A document has a
-- revision if and only if somebody saved it, because the trigger writes one on
-- every real change and nothing else writes to that table.
--
-- Same shape as the other admin functions: security definer because
-- private.document_revisions has no client access, an explicit search_path, and
-- a loud refusal rather than an empty list, so a broken gate cannot look like a
-- quiet history.
create or replace function public.admin_recently_edited(p_limit integer default 8)
returns table (
  id          uuid,
  collection  public.doc_collection,
  scope       public.slug,
  slug        public.slug,
  title       text,
  status      public.doc_status,
  updated_at  timestamptz,
  edits       bigint
)
language plpgsql
security definer
set search_path = private, public
stable
as $$
begin
  if not public.is_admin() then
    raise exception 'not an admin' using errcode = '42501';
  end if;

  return query
    select d.id, d.collection, d.scope, d.slug, d.title, d.status, d.updated_at,
           count(r.revision)
    from public.documents d
    join private.document_revisions r on r.document_id = d.id
    group by d.id
    order by d.updated_at desc
    limit greatest(1, least(p_limit, 50));
end;
$$;

revoke execute on function public.admin_recently_edited(integer) from public, anon;
grant execute on function public.admin_recently_edited(integer) to authenticated;
