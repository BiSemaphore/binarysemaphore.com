-- The notebooks: the catalog, who may read one, how far they got, and the
-- storage policy that makes the PDFs unreachable without an entitlement.

create table if not exists public.notebooks (
  id             public.slug primary key,
  title          text not null,
  subtitle       text,
  -- The folder inside the `notebooks` bucket. Today it equals the id, and
  -- until now only a comment in learn.ts said so while a storage policy
  -- depended on it. A column makes the coupling explicit and lets the two
  -- diverge later without rewriting a policy.
  storage_prefix text not null,
  status         public.doc_status not null default 'published',
  position       integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

drop trigger if exists notebooks_set_updated_at on public.notebooks;
create trigger notebooks_set_updated_at
  before update on public.notebooks
  for each row execute function public.set_updated_at();

alter table public.notebooks enable row level security;
grant select on public.notebooks to anon, authenticated;

drop policy if exists "Anyone can read the published catalog" on public.notebooks;
create policy "Anyone can read the published catalog"
  on public.notebooks for select to anon, authenticated
  using (status = 'published' or public.is_admin());

drop policy if exists "Admins can write the catalog" on public.notebooks;
create policy "Admins can write the catalog"
  on public.notebooks for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant insert, update, delete on public.notebooks to authenticated;

-- Access.
--
-- The old table carried `id uuid primary key` alongside `unique (user_id,
-- product_id)`. Production index statistics settled the argument: the primary
-- key had been scanned twice, the unique constraint 223 times. The composite
-- key was always the real one.
create table if not exists public.entitlements (
  user_id     uuid not null references auth.users (id) on delete cascade,
  notebook_id public.slug not null references public.notebooks (id) on delete cascade,
  -- check, not an enum: "how did this person come by access" is exactly the
  -- set that grows.
  status      text not null default 'active' check (status in ('active', 'revoked')),
  source      text not null check (source in ('account', 'purchase', 'gift')),
  expires_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (user_id, notebook_id)
);

drop trigger if exists entitlements_set_updated_at on public.entitlements;
create trigger entitlements_set_updated_at
  before update on public.entitlements
  for each row execute function public.set_updated_at();

alter table public.entitlements enable row level security;
grant select on public.entitlements to authenticated;

-- Read only, and only your own. There is deliberately no client write path:
-- access is granted by the function below, never by an insert from a browser.
drop policy if exists "Owners can read their entitlements" on public.entitlements;
create policy "Owners can read their entitlements"
  on public.entitlements for select to authenticated
  using (auth.uid() = user_id or public.is_admin());

-- Takes text rather than the slug domain on purpose: it is called with a
-- folder name pulled out of a storage path, which may be anything at all, and
-- a domain cast would raise instead of returning false.
create or replace function public.has_notebook_access(p_notebook text)
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
      and e.notebook_id::text = p_notebook
      and e.status = 'active'
      and (e.expires_at is null or e.expires_at > now())
  );
$$;

create or replace function public.grant_notebook_access(p_notebook text)
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
    select 1 from public.notebooks n
    where n.id::text = p_notebook and n.status = 'published'
  ) then
    raise exception 'unknown notebook: %', p_notebook using errcode = '22023';
  end if;

  insert into public.entitlements (user_id, notebook_id, status, source, expires_at)
  values (v_user, p_notebook::public.slug, 'active', 'account', null)
  on conflict (user_id, notebook_id) do nothing
  returning * into v_row;

  if v_row.user_id is null then
    select * into v_row
    from public.entitlements e
    where e.user_id = v_user and e.notebook_id::text = p_notebook;
  end if;

  return v_row;
end;
$$;

revoke execute on function public.grant_notebook_access(text) from public, anon;
grant execute on function public.grant_notebook_access(text) to authenticated;

create table if not exists public.reading_progress (
  user_id     uuid not null references auth.users (id) on delete cascade,
  notebook_id public.slug not null references public.notebooks (id) on delete cascade,
  section     text not null,
  read_at     timestamptz not null default now(),
  primary key (user_id, notebook_id, section)
);

create index if not exists reading_progress_resume_idx
  on public.reading_progress (user_id, notebook_id, read_at desc);

alter table public.reading_progress enable row level security;
grant select, insert, update, delete on public.reading_progress to authenticated;

drop policy if exists "Readers can see their own progress" on public.reading_progress;
create policy "Readers can see their own progress"
  on public.reading_progress for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Readers can record their own progress" on public.reading_progress;
create policy "Readers can record their own progress"
  on public.reading_progress for insert to authenticated
  with check (auth.uid() = user_id and char_length(section) between 1 and 120);

drop policy if exists "Readers can update their own progress" on public.reading_progress;
create policy "Readers can update their own progress"
  on public.reading_progress for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Readers can clear their own progress" on public.reading_progress;
create policy "Readers can clear their own progress"
  on public.reading_progress for delete to authenticated
  using (auth.uid() = user_id);

-- The bucket already exists and keeps its files; only the policy is rebuilt.
insert into storage.buckets (id, name, public)
values ('notebooks', 'notebooks', false)
on conflict (id) do nothing;

drop policy if exists "Entitled users can read notebooks" on storage.objects;
create policy "Entitled users can read notebooks"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'notebooks'
    and public.has_notebook_access((storage.foldername(name))[1])
  );
