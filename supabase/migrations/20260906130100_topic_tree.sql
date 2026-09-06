-- The tree is public. The prose is what gets published.
--
-- Found by querying the live API as anon: channel_meta returned 7 rows, not 93.
-- That is the satellite policy working exactly as written (a satellite is
-- readable when its document is) and being wrong for the product. The sidebar
-- shows all 93 channels with honest "nothing written yet" states, so hiding 86
-- of them turns the tree into a list of what we happen to have finished.
--
-- Titles, blurbs and ordering are not secrets: they are in git and on the page
-- today. A draft *body* is a secret, or will be once drafts contain prose
-- rather than nothing.
--
-- RLS is row level, so a policy cannot say "this row, without that column".
-- A view can. This one has no body column at all, which is the point: it cannot
-- leak an unpublished draft even by accident, and no future policy change can
-- make it start doing so.
--
-- Deliberately not `security_invoker`. The view runs as its owner and so is not
-- filtered by the documents policy, which is the whole reason it exists. The
-- safety comes from the columns it selects, not from RLS underneath it.
create or replace view public.topic_tree as
  select
    d.id,
    d.scope       as subject,
    d.slug,
    d.title,
    d.summary,
    -- So the UI can say "written" or "nothing here yet" without asking for a
    -- body it may not read.
    d.status = 'published' as written,
    cm.position,
    cm.reference,
    cm.notebook_id
  from public.documents d
  join public.channel_meta cm on cm.document_id = d.id
  where d.collection = 'channel'
    and d.status <> 'archived';

grant select on public.topic_tree to anon, authenticated;

comment on view public.topic_tree is
  'Every channel in the tree, written or not, without any body. Read the body from documents, which is published-only.';
