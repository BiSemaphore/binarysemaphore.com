-- The resume builder at resume.binarysemaphore.com. A separate product that
-- shares only the account, kept here so the schema is complete in one place.

create table if not exists public.resumes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null default 'Untitled' check (char_length(title) between 1 and 200),
  template_id text not null default 'classic',
  page_size   text not null default 'a4' check (page_size in ('a4', 'letter')),
  -- Bounded because they drive a print layout, and an unbounded scale renders
  -- a page nobody can read.
  scale_pct   integer not null default 100 check (scale_pct between 50 and 200),
  pad_top     integer not null default 12  check (pad_top between 0 and 96),
  pad_bottom  integer not null default 12  check (pad_bottom between 0 and 96),
  text_align  text not null default 'left' check (text_align in ('left', 'justify')),
  content     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists resumes_user_id_idx on public.resumes (user_id);

drop trigger if exists resumes_set_updated_at on public.resumes;
create trigger resumes_set_updated_at
  before update on public.resumes
  for each row execute function public.set_updated_at();

alter table public.resumes enable row level security;
grant select, insert, update, delete on public.resumes to authenticated;

drop policy if exists "Owners can read their resumes" on public.resumes;
create policy "Owners can read their resumes"
  on public.resumes for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Owners can create their resumes" on public.resumes;
create policy "Owners can create their resumes"
  on public.resumes for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Owners can update their resumes" on public.resumes;
create policy "Owners can update their resumes"
  on public.resumes for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Owners can delete their resumes" on public.resumes;
create policy "Owners can delete their resumes"
  on public.resumes for delete to authenticated using (auth.uid() = user_id);
