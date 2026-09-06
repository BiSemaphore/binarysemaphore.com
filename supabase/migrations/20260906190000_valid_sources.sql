-- Source attribution has to survive the editor.
--
-- tests/lib/learn/credit.test.ts asserted that every credited lecture has a
-- real YouTube url, a title worth reading and a duration in the notebooks' own
-- "2h45" format. It could do that while the catalog was a literal in
-- src/lib/learn.ts. The rows are editable now, so the rule has to live with
-- them, for the same reason the channel naming rule moved.
--
-- Credit is not optional here: most of these notebooks expand someone else's
-- lecture, and a reader deserves to know whose work they are standing on and
-- be able to go and watch it. A broken url is a broken credit.
--
-- A helper function rather than the check itself, because a CHECK constraint
-- cannot contain a subquery and validating each element of an array needs one.
-- `immutable` is what makes it usable in a constraint at all.
create or replace function public.sources_are_valid(p_sources jsonb)
returns boolean
language sql
immutable
as $$
  select jsonb_typeof(p_sources) = 'array'
     and coalesce(bool_and(
           s->>'url' ~ '^https://www\.youtube\.com/watch\?v=[A-Za-z0-9_-]{11}$'
           and length(coalesce(s->>'title', '')) > 5
           and s->>'duration' ~ '^[0-9]+h[0-9]{2}$'
         ), true)
  from jsonb_array_elements(
         case when jsonb_typeof(p_sources) = 'array' then p_sources else '[]'::jsonb end
       ) s;
$$;

alter table public.notebooks drop constraint if exists sources_are_real;
alter table public.notebooks
  add constraint sources_are_real check (public.sources_are_valid(sources));
