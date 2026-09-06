-- Content.
--
-- The idea this file rests on: we do not have three kinds of content, we have
-- one. A thread, a topic channel and a notebook section are each a slug, a
-- title, a body of MDX and a publish state. They differ in what surrounds them,
-- not in what they are. Three tables would mean three editors, three revision
-- tables, three publish workflows and three search indexes, forever.
--
-- So: one `documents` table for what they share, and a thin satellite per kind
-- for what only that kind has. Not one wide table with nullable columns, which
-- is the version of this idea that goes wrong: on a wide table
-- `channel.subject` would have to be nullable, because threads have no
-- subject, and "every channel has a subject" would become a rule enforced in
-- TypeScript and therefore eventually not enforced at all.

create table if not exists public.subjects (
  slug       public.slug primary key,
  name       text not null,
  blurb      text not null,
  icon       text not null,
  position   integer not null default 0,
  status     public.doc_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists subjects_set_updated_at on public.subjects;
create trigger subjects_set_updated_at
  before update on public.subjects
  for each row execute function public.set_updated_at();

create table if not exists public.documents (
  -- A surrogate key that earns its place, unlike the one the old entitlements
  -- table carried: revisions and satellites point at a document, and a
  -- document's slug can then change without breaking either.
  id           uuid primary key default gen_random_uuid(),
  collection   public.doc_collection not null,
  -- The container a slug is unique within: the subject for a channel, the
  -- notebook for a section, nothing for a thread. Slugs are NOT globally
  -- unique per collection: java has a channel called interview-questions and
  -- so will half the other subjects.
  scope        public.slug,
  slug         public.slug not null,
  title        text not null,
  summary      text,
  body_mdx     text,
  status       public.doc_status not null default 'draft',
  origin       public.doc_origin not null default 'admin',
  published_at timestamptz,
  created_by   uuid references auth.users (id) on delete set null,
  updated_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- Two-argument to_tsvector, because the one-argument form reads
  -- default_text_search_config and is therefore only stable, which a generated
  -- column will not accept.
  search tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')),    'A') ||
    setweight(to_tsvector('english', coalesce(summary, '')),  'B') ||
    setweight(to_tsvector('english', coalesce(body_mdx, '')), 'C')
  ) stored,

  -- The constraint that makes the admin safe: an empty page cannot reach the
  -- site by accident, because the database will not hold one.
  constraint published_has_a_body
    check (status <> 'published' or (body_mdx is not null and published_at is not null)),

  -- A thread has no scope, so its scope is null, and null must collide with
  -- null here or two threads could share a slug. Postgres 15 and up.
  constraint documents_slug_unique_in_scope
    unique nulls not distinct (collection, scope, slug)
);

create index if not exists documents_search_idx
  on public.documents using gin (search);

-- The listing query for every reader-facing page.
create index if not exists documents_live_idx
  on public.documents (collection, status, published_at desc);

-- body_mdx is large and Postgres moves it out of line automatically, so a
-- listing that does not select it does not pay for it. No separate body table
-- is needed, and adding one would only buy an extra join.

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

-- Satellites. Each column here is `not null` precisely because it lives on the
-- satellite rather than on a shared wide table.

create table if not exists public.thread_meta (
  document_id uuid primary key references public.documents (id) on delete cascade,
  cover_image text,
  tags        text[] not null default '{}'
);

create table if not exists public.channel_meta (
  document_id uuid primary key references public.documents (id) on delete cascade,
  subject     public.slug not null references public.subjects (slug) on delete cascade,
  position    integer not null default 0,
  -- The canonical external reference for a channel we have not written yet.
  reference   jsonb,
  notebook_id public.slug references public.notebooks (id) on delete set null
);

create index if not exists channel_meta_subject_idx
  on public.channel_meta (subject, position);

create table if not exists public.section_meta (
  document_id uuid primary key references public.documents (id) on delete cascade,
  notebook_id public.slug not null references public.notebooks (id) on delete cascade,
  position    integer not null default 0
);

create index if not exists section_meta_notebook_idx
  on public.section_meta (notebook_id, position);

-- Ordering is a plain integer with no unique constraint, read as
-- `order by (position, title)`, so a reorder is a handful of updates rather
-- than a deferred-constraint dance. At 23 subjects and 93 channels, fractional
-- or gap-based ordering would be machinery maintained for no reason. Revisit
-- somewhere above a few thousand rows.

-- `documents.scope` and the satellite's own foreign key have to agree. Nothing
-- in SQL expresses "this column equals that column in another table", so a
-- trigger does, generically, named by argument. Enforced in the database
-- rather than in the one write path somebody will later forget.
create or replace function private.scope_must_match()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_scope text;
  v_own   text := to_jsonb(new) ->> tg_argv[0];
begin
  select d.scope::text into v_scope from public.documents d where d.id = new.document_id;

  if v_scope is distinct from v_own then
    raise exception
      'documents.scope (%) must equal %.% (%)', v_scope, tg_table_name, tg_argv[0], v_own
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists channel_meta_scope on public.channel_meta;
create trigger channel_meta_scope
  before insert or update on public.channel_meta
  for each row execute function private.scope_must_match('subject');

drop trigger if exists section_meta_scope on public.section_meta;
create trigger section_meta_scope
  before insert or update on public.section_meta
  for each row execute function private.scope_must_match('notebook_id');

-- Revisions. This is the rollback that leaving git costs us.
create table if not exists private.document_revisions (
  document_id uuid not null references public.documents (id) on delete cascade,
  revision    integer not null,
  title       text not null,
  body_mdx    text,
  status      public.doc_status not null,
  saved_by    uuid references auth.users (id) on delete set null,
  saved_at    timestamptz not null default now(),
  primary key (document_id, revision)
);

-- Written by a trigger rather than by application code, because a trigger
-- cannot be forgotten by the one code path that skipped it. The previous row
-- is stored, not the new one, so revision N is what the page looked like
-- before save N.
create or replace function private.record_revision()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if new.title is distinct from old.title
     or new.body_mdx is distinct from old.body_mdx
     or new.status is distinct from old.status then

    insert into private.document_revisions (document_id, revision, title, body_mdx, status, saved_by)
    select old.id,
           coalesce(max(r.revision), 0) + 1,
           old.title, old.body_mdx, old.status,
           auth.uid()
    from private.document_revisions r
    where r.document_id = old.id;
  end if;

  return null;
end;
$$;

drop trigger if exists documents_record_revision on public.documents;
create trigger documents_record_revision
  after update on public.documents
  for each row execute function private.record_revision();

-- Row level security.
--
-- The whole rule: the world reads what is published, admins read and write
-- everything. RLS filters rows but does not grant table access, so both the
-- grant and the policy are required; forgetting the grant is what produced
-- "permission denied for table entitlements" the first time round.

alter table public.subjects     enable row level security;
alter table public.documents    enable row level security;
alter table public.thread_meta  enable row level security;
alter table public.channel_meta enable row level security;
alter table public.section_meta enable row level security;

grant select on public.subjects, public.documents,
                public.thread_meta, public.channel_meta, public.section_meta
  to anon, authenticated;

grant insert, update, delete on public.subjects, public.documents,
                                public.thread_meta, public.channel_meta, public.section_meta
  to authenticated;

drop policy if exists "Anyone can read published subjects" on public.subjects;
create policy "Anyone can read published subjects"
  on public.subjects for select to anon, authenticated
  using (status = 'published' or public.is_admin());

drop policy if exists "Admins can write subjects" on public.subjects;
create policy "Admins can write subjects"
  on public.subjects for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Anyone can read published documents" on public.documents;
create policy "Anyone can read published documents"
  on public.documents for select to anon, authenticated
  using (status = 'published' or public.is_admin());

drop policy if exists "Admins can write documents" on public.documents;
create policy "Admins can write documents"
  on public.documents for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- A satellite is readable exactly when its document is, so the policy asks the
-- document rather than repeating the rule and drifting from it.
do $$
declare t text;
begin
  foreach t in array array['thread_meta', 'channel_meta', 'section_meta'] loop
    execute format('drop policy if exists "Readable with its document" on public.%I', t);
    execute format($f$
      create policy "Readable with its document" on public.%I for select to anon, authenticated
      using (exists (
        select 1 from public.documents d
        where d.id = document_id and (d.status = 'published' or public.is_admin())
      ))$f$, t);

    execute format('drop policy if exists "Admins can write it" on public.%I', t);
    execute format($f$
      create policy "Admins can write it" on public.%I for all to authenticated
      using (public.is_admin()) with check (public.is_admin())$f$, t);
  end loop;
end $$;
