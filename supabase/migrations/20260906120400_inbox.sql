-- Everything people send us.
--
-- `contact_messages` and `mentorship_requests` were the same entity in two
-- shapes: somebody we do not know, an email address, some prose, and some
-- situational detail. Neither had a handled state and neither had a read path,
-- so answering one meant opening the Supabase dashboard. Both had received
-- zero messages, which is its own argument for rebuilding rather than keeping.

create table if not exists private.inbox (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null check (kind in ('contact', 'mentorship')),
  name       text not null,
  email      text not null,
  body       text not null,
  -- The fields that differ between the two kinds: college, paper, whatever the
  -- next form asks. A bag, deliberately, because we display it and never query
  -- it. The moment we query one of these, it becomes a column.
  context    jsonb not null default '{}'::jsonb,
  -- The two columns that turn a dead drop into an inbox.
  status     text not null default 'new' check (status in ('new', 'answered', 'ignored')),
  handled_at timestamptz,
  handled_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint handled_rows_say_when
    check (status = 'new' or handled_at is not null)
);

create index if not exists inbox_open_idx
  on private.inbox (status, created_at desc);

drop trigger if exists inbox_set_updated_at on private.inbox;
create trigger inbox_set_updated_at
  before update on private.inbox
  for each row execute function public.set_updated_at();

-- No grants to anon or authenticated at all, and the schema is not exposed to
-- PostgREST, so this table has no URL. Submissions arrive through a Next.js
-- server action using the service key. That moves validation to one place we
-- can also rate limit, and it is why there are no length checks in a policy
-- here: there is no policy, because there is no client.

-- What a reader wants that we have not written.
--
-- This one stays in `public` and stays separate from the inbox, because unlike
-- a contact message the reader must be able to read their own row back: the
-- button has to say "you asked for this" instead of inviting the same person
-- to ask five times.
create table if not exists public.note_requests (
  user_id    uuid not null references auth.users (id) on delete cascade,
  -- Free text, not a foreign key. The whole point is to ask for something that
  -- does not exist yet, so there is nothing to reference.
  topic      text not null,
  note       text,
  created_at timestamptz not null default now(),
  -- Asking twice is not a stronger signal, and this makes "have they already
  -- asked" a primary key lookup.
  primary key (user_id, topic)
);

-- "What should we write next" is a count per topic, read with the service key.
create index if not exists note_requests_topic_idx
  on public.note_requests (topic, created_at desc);

alter table public.note_requests enable row level security;
grant select, insert, delete on public.note_requests to authenticated;

drop policy if exists "Readers can see their own requests" on public.note_requests;
create policy "Readers can see their own requests"
  on public.note_requests for select to authenticated
  using (auth.uid() = user_id or public.is_admin());

-- The `with check` is the boundary: it stops one reader filing as another, and
-- bounds both fields so the table cannot be used as free storage.
drop policy if exists "Readers can request a note" on public.note_requests;
create policy "Readers can request a note"
  on public.note_requests for insert to authenticated
  with check (
    auth.uid() = user_id
    and char_length(topic) between 1 and 80
    and (note is null or char_length(note) <= 500)
  );

-- Changing your mind is allowed. There is no update policy: a request is a
-- fact with a timestamp, so amending one means withdrawing it and asking again.
drop policy if exists "Readers can withdraw their own request" on public.note_requests;
create policy "Readers can withdraw their own request"
  on public.note_requests for delete to authenticated
  using (auth.uid() = user_id);

-- The one way in.
--
-- PostgREST cannot see a schema that is not exposed, so supabase-js cannot
-- reach private.inbox at all, service key or not. Rather than exposing the
-- schema and relying on absent grants, there is one security definer function
-- and execute on it is granted to service_role alone. anon and authenticated
-- cannot call it, so the only route to this table runs through a Next.js server
-- action, which is also where rate limiting will go.
create or replace function public.record_inbox_message(
  p_kind    text,
  p_name    text,
  p_email   text,
  p_body    text,
  p_context jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = private, public
as $$
declare
  v_id uuid;
begin
  -- Bounds live here rather than in a policy because there is no policy: there
  -- is no client. Same numbers the old insert policies used.
  if char_length(p_name)  not between 1 and 200  then raise exception 'bad name';  end if;
  if char_length(p_email) not between 3 and 320  then raise exception 'bad email'; end if;
  if char_length(p_body)  not between 1 and 5000 then raise exception 'bad body';  end if;

  insert into private.inbox (kind, name, email, body, context)
  values (p_kind, p_name, p_email, p_body, coalesce(p_context, '{}'::jsonb))
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.record_inbox_message(text, text, text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.record_inbox_message(text, text, text, text, jsonb)
  to service_role;
