-- Reading time, computed by the database.
--
-- The listing pages need "4 min read" for every thread, and reading time comes
-- from the body. Selecting body_mdx to count its words would pull the largest
-- column in the table into every listing query, which is exactly what keeping
-- the body in this table was supposed to avoid: Postgres stores it out of line,
-- so a listing that does not name it does not pay for it.
--
-- A generated column keeps that true. Every function in it is immutable, which
-- is what `stored` requires.
--
-- 200 words a minute, and never zero, matching what readingMinutes() in
-- src/lib/threads.ts did when threads were files.
alter table public.documents
  add column if not exists reading_minutes integer
  generated always as (
    greatest(
      1,
      (array_length(regexp_split_to_array(coalesce(body_mdx, ''), '\s+'), 1) / 200)
    )
  ) stored;
