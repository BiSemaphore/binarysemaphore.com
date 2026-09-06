-- Clean slate.
--
-- The previous ten migrations grew by accretion: three of them were content
-- edits rather than schema, two tables held the same entity in different
-- shapes, and one table's primary key was measurably never used. Shahid
-- authorised dropping everything rather than reshaping it, on the grounds that
-- the whole of production was roughly 75 rows of exploratory data.
--
-- What is NOT dropped, deliberately:
--   auth.*            the accounts are real people who signed in with Google
--   storage.buckets   the notebook PDFs are assets that do not exist in git
--
-- Entitlements go, so anyone who had opened a notebook grants access again on
-- their next visit. That is one click and it was the explicit trade.

drop policy if exists "Entitled users can read notebooks" on storage.objects;

drop table if exists public.note_requests        cascade;
drop table if exists public.reading_progress     cascade;
drop table if exists public.entitlements         cascade;
drop table if exists public.learn_products       cascade;
drop table if exists public.mentorship_requests  cascade;
drop table if exists public.contact_messages     cascade;
drop table if exists public.resumes              cascade;

drop function if exists public.has_learn_access(text);
drop function if exists public.grant_learn_access(text);
drop function if exists public.start_learn_trial(text);
drop function if exists public.set_updated_at() cascade;
