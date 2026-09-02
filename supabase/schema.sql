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


-- ===========================================================================
-- Study Notebooks (learn.binarysemaphore.com).
--
-- Mirrors supabase/migrations/0003_learn.sql. Access model and rationale are in
-- docs/learn.md. Short version: an `entitlements` row grants one user one
-- notebook, the only write path is start_learn_trial(), and the storage policy
-- re-checks the same predicate so the app is never the security boundary.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Catalog. Copy lives in src/lib/learn.ts; this table holds only the ids the
-- database needs for foreign keys and validation. tests/lib/learn.test.ts
-- asserts the two stay in sync.
-- ---------------------------------------------------------------------------
create table if not exists public.learn_products (
  id          text primary key,
  title       text not null,
  -- 'notebook' today. Room for 'bundle' / 'membership' without a migration.
  kind        text not null default 'notebook',
  -- Stripe price id, once payments exist. Null means "not for sale yet".
  price_ref   text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.learn_products enable row level security;

-- The catalog is public information (it is already in the repo).
drop policy if exists "Anyone can read the notebook catalog" on public.learn_products;
create policy "Anyone can read the notebook catalog"
  on public.learn_products for select
  to anon, authenticated
  using (active);

-- ---------------------------------------------------------------------------
-- Entitlements. One row per (user, product).
-- ---------------------------------------------------------------------------
create table if not exists public.entitlements (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  product_id  text not null references public.learn_products (id) on delete cascade,
  -- 'active' | 'revoked'. Expiry is expires_at, not a status.
  status      text not null default 'active',
  -- 'trial' | 'stripe' | 'manual' | 'gift'.
  source      text not null,
  -- null = perpetual (what a paid grant will use).
  expires_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, product_id)
);

create index if not exists entitlements_user_id_idx on public.entitlements (user_id);

alter table public.entitlements enable row level security;

-- Users may READ their own grants and nothing else. There is deliberately no
-- insert/update/delete policy: a client cannot mint, extend, or un-expire its
-- own access. The only write path is start_learn_trial() below, and later the
-- payment webhook (which runs with a secret key and bypasses RLS).
drop policy if exists "Owners can read their entitlements" on public.entitlements;
create policy "Owners can read their entitlements"
  on public.entitlements for select
  to authenticated
  using (auth.uid() = user_id);

drop trigger if exists entitlements_set_updated_at on public.entitlements;
create trigger entitlements_set_updated_at
  before update on public.entitlements
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Table privileges.
--
-- RLS filters rows; it does not grant access to the table in the first place.
-- Both are needed, and Supabase's default privileges for the `public` schema
-- cannot be relied on (on a stack built by the current CLI they hand `anon` and
-- `authenticated` only Dxtm, with no SELECT), so say it explicitly here.
--
-- Note what is NOT granted: no insert, update or delete on entitlements, to
-- anyone. Writes go through start_learn_trial(), which is security definer and
-- runs as the table owner, and later through the payment webhook, which uses
-- the secret key. A signed-in user holds read access and nothing more.
-- ---------------------------------------------------------------------------
grant select on public.learn_products to anon, authenticated;
grant select on public.entitlements to authenticated;

-- ---------------------------------------------------------------------------
-- The single access predicate. Everything (pages, download route, storage
-- policy) asks this one question, so there is one definition of "may read".
-- security invoker: it reads public.entitlements under the caller's own RLS.
-- ---------------------------------------------------------------------------
create or replace function public.has_learn_access(p_product_id text)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.entitlements e
    where e.user_id = auth.uid()
      and e.product_id = p_product_id
      and e.status = 'active'
      and (e.expires_at is null or e.expires_at > now())
  );
$$;

-- ---------------------------------------------------------------------------
-- Free trial. security definer because it writes a table the caller may not
-- write. The expiry is computed here, on the server, so it cannot be forged.
--
-- Trial length is 7 days. Keep in sync with TRIAL_DAYS in src/lib/learn/access.ts
-- (which is only used for copy; this value is authoritative).
--
-- `on conflict do nothing` makes it idempotent and non-renewable: calling it
-- again after a trial lapses returns the expired row rather than extending it.
-- ---------------------------------------------------------------------------
create or replace function public.start_learn_trial(p_product_id text)
returns public.entitlements
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_row  public.entitlements;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  if not exists (
    select 1 from public.learn_products p
    where p.id = p_product_id and p.active
  ) then
    raise exception 'unknown notebook: %', p_product_id using errcode = '22023';
  end if;

  insert into public.entitlements (user_id, product_id, status, source, expires_at)
  values (v_user, p_product_id, 'active', 'trial', now() + interval '7 days')
  on conflict (user_id, product_id) do nothing
  returning * into v_row;

  -- Already had a grant (active, or a lapsed trial): return it unchanged.
  if v_row.id is null then
    select * into v_row
    from public.entitlements e
    where e.user_id = v_user and e.product_id = p_product_id;
  end if;

  return v_row;
end;
$$;

revoke execute on function public.start_learn_trial(text) from public, anon;
grant execute on function public.start_learn_trial(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Storage. Private bucket, one folder per notebook:
--   notebooks/<product_id>/<Title>-<Edition>.pdf
-- The policy re-asks has_learn_access() from the first path segment, so even a
-- leaked object path is useless without a live entitlement. This is why the
-- download route can hand out a signed URL without being the security boundary.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('notebooks', 'notebooks', false)
on conflict (id) do nothing;

drop policy if exists "Entitled users can read notebooks" on storage.objects;
create policy "Entitled users can read notebooks"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'notebooks'
    and public.has_learn_access((storage.foldername(name))[1])
  );

-- ---------------------------------------------------------------------------
-- Seed the catalog. Titles are duplicated from src/lib/learn.ts only so rows
-- are readable in the dashboard; the site never reads them from here.
-- ---------------------------------------------------------------------------
insert into public.learn_products (id, title) values
  ('question-bank', 'Question Bank'),
  ('large-scale-ingestion', 'Large-Scale Data Ingestion'),
  ('object-storage', 'Object Storage'),
  ('full-stack-code-review', 'Full-Stack Code Review'),
  ('postgres', 'Postgres'),
  ('security', 'Backend Security'),
  ('scaling', 'Scaling and Performance'),
  ('real-time-backends', 'Real-Time Backends')
on conflict (id) do update set title = excluded.title;

-- Retired: see supabase/migrations/0004_retire_code_review.sql. Kept as an
-- inactive row rather than deleted, because entitlements reference it.
update public.learn_products
set active = false
where id = 'full-stack-code-review';

-- Added later: see supabase/migrations/0005_add_notebooks_08_09.sql.
insert into public.learn_products (id, title) values
  ('rest-api-design', 'REST API Design'),
  ('design-principles', 'Design Principles')
on conflict (id) do update set title = excluded.title, active = true;

-- Reading progress: mirrors supabase/migrations/0006_reading_progress.sql.
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

-- Access without expiry: mirrors supabase/migrations/0007_access_without_expiry.sql.
update public.entitlements
set expires_at = null
where expires_at is not null;

-- Replaces start_learn_trial. Same shape, same security-definer reasoning: the
-- row is written server-side so a client cannot forge one. It simply no longer
-- computes an expiry.
create or replace function public.grant_learn_access(p_product_id text)
returns public.entitlements
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_row  public.entitlements;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  if not exists (
    select 1 from public.learn_products p
    where p.id = p_product_id and p.active
  ) then
    raise exception 'unknown notebook: %', p_product_id using errcode = '22023';
  end if;

  insert into public.entitlements (user_id, product_id, status, source, expires_at)
  values (v_user, p_product_id, 'active', 'account', null)
  on conflict (user_id, product_id) do nothing
  returning * into v_row;

  if v_row.id is null then
    select * into v_row
    from public.entitlements e
    where e.user_id = v_user and e.product_id = p_product_id;
  end if;

  return v_row;
end;
$$;

revoke execute on function public.grant_learn_access(text) from public, anon;
grant execute on function public.grant_learn_access(text) to authenticated;

drop function if exists public.start_learn_trial(text);

-- Mentorship requests: mirrors supabase/migrations/0008_mentorship_requests.sql.
create table if not exists public.mentorship_requests (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null,
  email       text not null,
  -- College and year, free text: "NIT Trichy, 3rd year". Optional.
  college     text,
  -- The paper or subject they are stuck in.
  paper       text not null,
  -- Where it stopped making sense, in their words.
  stuck       text not null
);

create index if not exists mentorship_requests_created_idx
  on public.mentorship_requests (created_at desc);

alter table public.mentorship_requests enable row level security;

-- Insert only. Read the queue in the dashboard or with the secret key; there is
-- deliberately no select policy, so a browser cannot enumerate who has asked.
grant insert on public.mentorship_requests to anon, authenticated;

drop policy if exists "Anyone can ask for mentorship" on public.mentorship_requests;
create policy "Anyone can ask for mentorship"
  on public.mentorship_requests
  for insert
  to anon, authenticated
  with check (
    char_length(name) between 1 and 200
    and char_length(email) between 3 and 320
    and char_length(coalesce(college, '')) <= 200
    and char_length(paper) between 1 and 200
    and char_length(stuck) between 1 and 5000
  );
