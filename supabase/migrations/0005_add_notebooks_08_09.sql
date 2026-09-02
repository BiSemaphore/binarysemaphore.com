-- Two more notebooks: REST API Design (System Design 08) and Design Principles
-- (System Design 09).
--
-- Every notebook needs a row here before it can be opened: start_learn_trial()
-- validates against this table, and the storage policy resolves the first path
-- segment of an object key through has_learn_access(). Without the row, the
-- page renders but the button always errors.

insert into public.learn_products (id, title) values
  ('rest-api-design', 'REST API Design'),
  ('design-principles', 'Design Principles')
on conflict (id) do update set title = excluded.title, active = true;
