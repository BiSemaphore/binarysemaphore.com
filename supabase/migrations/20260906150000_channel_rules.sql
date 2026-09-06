-- Two corrections that only became visible once channels were about to be
-- editable by hand.

-- 1. `roadmap` was lost.
--
-- A channel in topics.ts could point at a notebook OR a roadmap, and
-- channelState() reads both. The first schema kept notebook_id and dropped
-- roadmap, so every roadmap-backed channel would have silently degraded to
-- "nothing written yet". Caught while moving the reads, not while writing the
-- table, which is the usual way.
alter table public.channel_meta
  add column if not exists roadmap text;

-- 2. Channel names are situations, not syllabus entries.
--
-- This was enforced by a vitest over src/lib/learn/topics.ts: no leading digit,
-- no chapter-/unit-/week-, no intro/basics/fundamentals/getting-started. That
-- test cannot see a channel typed into an admin form, and the rule is not a
-- style preference: nobody arrives at a channel needing chapter one, they
-- arrive because something is broken on the other monitor.
--
-- A rule that survives the editor has to live where the row does.
alter table public.documents
  drop constraint if exists channel_slugs_are_situations;

alter table public.documents
  add constraint channel_slugs_are_situations check (
    collection <> 'channel'
    or (
      slug !~ '^[0-9]'
      and slug !~ '^(chapter|unit|part|lesson|module|week)-'
      and slug !~ '(^|-)(intro|introduction|basics|fundamentals|getting-started)(-|$)'
    )
  );

-- The view gains the column. Dropped rather than replaced because
-- `create or replace view` cannot add a column in the middle of the list.
drop view if exists public.topic_tree;

create view public.topic_tree as
  select
    d.id,
    d.scope       as subject,
    d.slug,
    d.title,
    d.summary,
    d.status = 'published' as written,
    cm.position,
    cm.reference,
    cm.notebook_id,
    cm.roadmap
  from public.documents d
  join public.channel_meta cm on cm.document_id = d.id
  where d.collection = 'channel'
    and d.status <> 'archived';

grant select on public.topic_tree to anon, authenticated;

comment on view public.topic_tree is
  'Every channel in the tree, written or not, without any body. Read the body from documents, which is published-only.';
