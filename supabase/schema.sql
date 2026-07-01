-- Binary Semaphore — Supabase schema
-- Run this in the Supabase SQL editor (or via the CLI) to create the tables the
-- app expects.

-- Contact form submissions (written by POST /api/contact).
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  message text not null
);

alter table public.contact_messages enable row level security;

-- Anyone may submit a message (the API writes with the publishable/anon role),
-- but there is no select/update/delete policy, so messages cannot be read back
-- through the API. Read them in the Supabase dashboard or with a secret key.
-- (Policies use drop-then-create because Postgres has no CREATE POLICY IF NOT
-- EXISTS, so the whole file stays safe to re-run.)
drop policy if exists "Anyone can submit a contact message" on public.contact_messages;
create policy "Anyone can submit a contact message"
  on public.contact_messages
  for insert
  to anon, authenticated
  -- Bounded instead of `true`: still an open, insert-only public form, but the
  -- payload must be non-empty and within sane sizes (blocks empty/huge spam and
  -- satisfies the "RLS policy always true" advisor).
  with check (
    char_length(name) between 1 and 200
    and char_length(email) between 3 and 320
    and char_length(message) between 1 and 5000
  );

-- Resume builder (resume.binarysemaphore.com). One row per saved resume; the
-- editable document lives in `content` (jsonb, shape = ResumeContent in
-- src/lib/resume/schema.ts).
create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'Untitled',
  template_id text not null default 'classic',
  page_size text not null default 'a4',
  -- "tune" controls: overall zoom (percent) and page margins (mm).
  scale_pct integer not null default 100,
  pad_top integer not null default 12,
  pad_bottom integer not null default 12,
  text_align text not null default 'left',
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- For tables created before these presentation columns existed (idempotent).
alter table public.resumes
  add column if not exists page_size text not null default 'a4';
alter table public.resumes
  add column if not exists scale_pct integer not null default 100;
alter table public.resumes
  add column if not exists pad_top integer not null default 12;
alter table public.resumes
  add column if not exists pad_bottom integer not null default 12;
alter table public.resumes
  add column if not exists text_align text not null default 'left';

create index if not exists resumes_user_id_idx on public.resumes (user_id);

alter table public.resumes enable row level security;

-- Each user can only see and change their own resumes. RLS does the
-- authorization; the app code just scopes its queries.
drop policy if exists "Owners can read their resumes" on public.resumes;
create policy "Owners can read their resumes"
  on public.resumes for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Owners can create their resumes" on public.resumes;
create policy "Owners can create their resumes"
  on public.resumes for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Owners can update their resumes" on public.resumes;
create policy "Owners can update their resumes"
  on public.resumes for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Owners can delete their resumes" on public.resumes;
create policy "Owners can delete their resumes"
  on public.resumes for delete to authenticated
  using (auth.uid() = user_id);

-- Keep updated_at current on every write. `security invoker` + an empty
-- search_path pin the function so it can't be hijacked via a mutable search
-- path (resolves the "function search path mutable" advisor). now() lives in
-- pg_catalog, which is always resolved, so no qualification is needed.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists resumes_set_updated_at on public.resumes;
create trigger resumes_set_updated_at
  before update on public.resumes
  for each row execute function public.set_updated_at();
