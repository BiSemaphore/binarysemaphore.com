-- Study Notebooks (learn.binarysemaphore.com).
--
-- Access model: a "product" is one notebook. A user gets an `entitlement` row
-- to read it. Today the only source of an entitlement is a free time-limited
-- trial; when payments land, a paid grant is the same row with
-- `source = 'stripe'` and `expires_at = null`. Nothing else has to change.
--
-- Authorization is Postgres-side (RLS + one security-definer grant function),
-- so the app never decides who may read a file. Idempotent, like 0001/0002.

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
