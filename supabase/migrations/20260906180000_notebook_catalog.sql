-- The rest of the notebook catalog.
--
-- The table held id, title, subtitle, storage_prefix, status and position,
-- which was enough for the entitlements foreign key and the storage policy and
-- nothing else. Everything the pages actually render (the series it belongs to,
-- its number in that series, the blurb, the page count, the table of contents,
-- which editions exist, and the lectures it expands) stayed in learn.ts, so the
-- catalog still had two sources of truth.
--
-- Three of these are jsonb rather than columns, and the rule is the same one
-- used for inbox.context: we render them and never query them. The moment we
-- query one, it becomes a column.
alter table public.notebooks
  add column if not exists series   text,
  add column if not exists number   text,
  add column if not exists blurb    text,
  add column if not exists pages    integer not null default 0,
  -- The full table of contents. Free to read: it is the best preview there is.
  add column if not exists contents text[]  not null default '{}',
  -- { reading: { file, bytes }, ... }. Not every notebook has all three cuts,
  -- which is why this is a map and not three columns.
  add column if not exists assets   jsonb   not null default '{}'::jsonb,
  -- The lectures a notebook expands. Empty when it was written from scratch,
  -- which the page says rather than leaving the reader to guess.
  add column if not exists sources  jsonb   not null default '[]'::jsonb;

-- The constraint that a published notebook is a real one comes in a later
-- migration, after the sync fills these columns. Adding it here would fail:
-- the rows exist and their new columns are still at their defaults, which is
-- the ordering every backfill has and the reason this is two migrations.
