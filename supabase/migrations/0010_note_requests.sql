-- Note requests: "we have not written this yet, tell us you want it".
--
-- 52 of the 64 topics have nothing of ours behind them. Rather than guessing
-- which to write next, the topic page asks, and this table is the answer.
--
-- Unlike mentorship_requests, a reader may read their own rows back. The button
-- has to be able to say "you asked for this" instead of inviting the same person
-- to ask five times, and their own request is not information worth hiding from
-- them. The queue itself is still not readable from a browser: a select is
-- restricted to your own rows, so nobody can enumerate who wants what.
--
-- The email is deliberately NOT stored. auth.users already has it, joined
-- server-side when the queue is read with the service key. Copying it here would
-- create a second copy to keep in step and a second thing to leak.

create table if not exists public.note_requests (
  user_id    uuid not null references auth.users (id) on delete cascade,
  topic      text not null,
  -- Optional: what specifically they are stuck on. Bounded by the policy below.
  note       text,
  created_at timestamptz not null default now(),
  -- One request per person per topic. Asking twice is not a stronger signal,
  -- and this makes the "already asked" check a primary key lookup.
  primary key (user_id, topic)
);

-- "What should we write next" is a count per topic, read server-side.
create index if not exists note_requests_topic_idx
  on public.note_requests (topic, created_at desc);

alter table public.note_requests enable row level security;

-- RLS filters rows; it does not grant table access. Both are required, and
-- forgetting this half is what produced "permission denied for table
-- entitlements" the first time round.
grant select, insert, delete on public.note_requests to authenticated;

drop policy if exists "Readers can see their own requests" on public.note_requests;
create policy "Readers can see their own requests"
  on public.note_requests for select
  to authenticated
  using (auth.uid() = user_id);

-- The `with check` is the boundary: it stops one reader filing a request as
-- another, and bounds both fields so the table cannot be used as free storage.
drop policy if exists "Readers can request a note" on public.note_requests;
create policy "Readers can request a note"
  on public.note_requests for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and char_length(topic) between 1 and 80
    and (note is null or char_length(note) <= 500)
  );

-- Changing your mind is allowed. There is no update policy: a request is a fact
-- with a timestamp, so amending one means withdrawing it and asking again.
drop policy if exists "Readers can withdraw their own request" on public.note_requests;
create policy "Readers can withdraw their own request"
  on public.note_requests for delete
  to authenticated
  using (auth.uid() = user_id);
