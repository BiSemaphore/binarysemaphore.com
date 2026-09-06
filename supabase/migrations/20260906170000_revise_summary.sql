-- Revisions were missing the summary.
--
-- document_revisions stored title, body and status, and the trigger fired on a
-- change to any of those. The summary is a thread's description and a channel's
-- sidebar line: it is content, it is rewritten often, and it was neither
-- versioned nor treated as a change worth recording. Editing only the summary
-- left no revision at all, so there was nothing to roll back to.
--
-- Found by asserting an edit writes a revision and getting zero, then noticing
-- the test had edited the one field the trigger ignored.
alter table private.document_revisions
  add column if not exists summary text;

create or replace function private.record_revision()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if new.title    is distinct from old.title
     or new.summary  is distinct from old.summary
     or new.body_mdx is distinct from old.body_mdx
     or new.status   is distinct from old.status then

    insert into private.document_revisions
      (document_id, revision, title, summary, body_mdx, status, saved_by)
    select old.id,
           coalesce(max(r.revision), 0) + 1,
           old.title, old.summary, old.body_mdx, old.status,
           auth.uid()
    from private.document_revisions r
    where r.document_id = old.id;
  end if;

  return null;
end;
$$;
