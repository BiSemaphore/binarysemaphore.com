-- Reading progress: which sections a reader has opened, and where they left off.
--
-- Unlike entitlements, this is the reader's own harmless data, so they may write
-- it directly. There is nothing to gain by forging it: it grants no access, and
-- the worst a tampered row can do is move your own bookmark.
--
-- Keyed by section slug rather than an id, because sections are generated from
-- the books and have no database identity. A renamed section leaves a dead row,
-- which the app ignores.

create table if not exists public.reading_progress (
  user_id     uuid not null references auth.users (id) on delete cascade,
  product_id  text not null references public.learn_products (id) on delete cascade,
  section     text not null,
  read_at     timestamptz not null default now(),
  primary key (user_id, product_id, section)
);

-- "Where did I leave off" is a per-user, per-book lookup of the newest row.
create index if not exists reading_progress_resume_idx
  on public.reading_progress (user_id, product_id, read_at desc);

alter table public.reading_progress enable row level security;

grant select, insert, update, delete on public.reading_progress to authenticated;

drop policy if exists "Readers can see their own progress" on public.reading_progress;
create policy "Readers can see their own progress"
  on public.reading_progress for select
  to authenticated
  using (auth.uid() = user_id);

-- The `with check` is what stops one reader writing progress as another.
drop policy if exists "Readers can record their own progress" on public.reading_progress;
create policy "Readers can record their own progress"
  on public.reading_progress for insert
  to authenticated
  with check (auth.uid() = user_id and char_length(section) between 1 and 120);

drop policy if exists "Readers can update their own progress" on public.reading_progress;
create policy "Readers can update their own progress"
  on public.reading_progress for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Forgetting a book you no longer want tracked.
drop policy if exists "Readers can clear their own progress" on public.reading_progress;
create policy "Readers can clear their own progress"
  on public.reading_progress for delete
  to authenticated
  using (auth.uid() = user_id);
