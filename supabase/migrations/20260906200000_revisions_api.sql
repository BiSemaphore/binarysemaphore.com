-- Reading and restoring revisions.
--
-- private.document_revisions has been filling up since the trigger was added,
-- and until now nothing could read it: the schema has no URL, so the history
-- that was supposed to buy back git's rollback was write-only. A stored
-- revision nobody can restore is not a rollback, it is a log.
--
-- Same shape as admin_inbox: security definer because it reads a schema the
-- caller has no privileges on, an explicit search_path because a definer
-- function without one is an escalation, and a loud refusal rather than an
-- empty result, so a broken gate cannot look like an empty history.

create or replace function public.admin_revisions(p_document uuid)
returns table (
  revision  integer,
  title     text,
  summary   text,
  status    public.doc_status,
  saved_at  timestamptz,
  saved_by  text,
  words     integer
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
    select r.revision, r.title, r.summary, r.status, r.saved_at,
           u.email::text,
           -- The body itself is not returned: a list of twenty revisions does
           -- not need twenty copies of the prose. A length is enough to see
           -- what a save did.
           array_length(regexp_split_to_array(coalesce(r.body_mdx, ''), '\s+'), 1)
    from private.document_revisions r
    left join auth.users u on u.id = r.saved_by
    where r.document_id = p_document
    order by r.revision desc;
end;
$$;

revoke execute on function public.admin_revisions(uuid) from public, anon;
grant execute on function public.admin_revisions(uuid) to authenticated;

-- Restore.
--
-- Writes the old values back onto the document, which fires record_revision()
-- again, so the state being replaced is itself stored first. That makes a
-- restore undoable, which matters: the most common reason to restore is
-- panic, and the second most common is realising the restore was wrong.
create or replace function public.admin_restore_revision(
  p_document uuid,
  p_revision integer
)
returns void
language plpgsql
security definer
set search_path = private, public
as $$
declare
  r private.document_revisions;
begin
  if not public.is_admin() then
    raise exception 'not an admin' using errcode = '42501';
  end if;

  select * into r
  from private.document_revisions
  where document_id = p_document and revision = p_revision;

  if r.document_id is null then
    raise exception 'no such revision' using errcode = '22023';
  end if;

  -- status is deliberately not restored. Restoring the words is what was
  -- asked for; silently unpublishing or republishing a live page because an
  -- old revision happened to be a draft is not.
  update public.documents
  set title    = r.title,
      summary  = r.summary,
      body_mdx = r.body_mdx
  where id = p_document;
end;
$$;

revoke execute on function public.admin_restore_revision(uuid, integer) from public, anon;
grant execute on function public.admin_restore_revision(uuid, integer) to authenticated;
