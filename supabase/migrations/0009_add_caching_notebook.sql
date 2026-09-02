-- Caching (System Design Notebook 10).
--
-- Every notebook needs a row here before it can be opened: grant_learn_access()
-- validates against this table, and the storage policy resolves an object key's
-- first path segment through has_learn_access(). Without the row the page
-- renders but the button always errors.

insert into public.learn_products (id, title) values
  ('caching', 'Caching')
on conflict (id) do update set title = excluded.title, active = true;
