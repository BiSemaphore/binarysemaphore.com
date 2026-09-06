-- A published notebook is a real one.
--
-- Deliberately a second migration. The columns it checks were added empty and
-- filled by the sync, so adding this alongside them failed with 23514: the rows
-- already existed at their defaults. That is the ordering every backfill has,
-- and splitting it is the fix, not weakening the constraint.
--
-- What it prevents: a card on the library page showing a title, no description
-- and "0 pages", which is what an admin creating a notebook and publishing it
-- before filling it in would otherwise produce.
alter table public.notebooks
  add constraint published_notebooks_are_real
  check (status <> 'published' or (pages > 0 and blurb is not null));
