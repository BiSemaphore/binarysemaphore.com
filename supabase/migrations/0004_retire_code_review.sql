-- Retire the Full-Stack Code Review notebook.
--
-- 0003 is already applied in production, so the seed there is history and must
-- not be edited. Deactivating is also the right move rather than deleting: the
-- row is the target of an `entitlements` foreign key, so dropping it would take
-- any grant with it, and `active = false` is exactly what that column is for.
--
-- The catalog in src/lib/learn.ts no longer lists it, so the site does not link
-- it, `start_learn_trial()` refuses it (it checks `active`), and the storage
-- policy denies its files because no live entitlement can exist.

update public.learn_products
set active = false
where id = 'full-stack-code-review';
