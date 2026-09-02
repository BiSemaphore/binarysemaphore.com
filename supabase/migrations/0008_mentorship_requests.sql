-- Mentorship requests from learn.binarysemaphore.com.
--
-- A separate table rather than reusing contact_messages, which is name, email
-- and a message blob. The useful part of a student's request is its structure:
-- which paper, which college and year, and where it stopped making sense. That
-- is what makes the queue triageable, and a blob loses it.
--
-- Security copies contact_messages exactly: an open, insert-only public form for
-- anon and authenticated, bounded validation in the policy, and no select
-- policy, so the queue cannot be read from a browser.

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
