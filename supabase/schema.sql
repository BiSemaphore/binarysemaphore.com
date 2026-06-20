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
create policy "Anyone can submit a contact message"
  on public.contact_messages
  for insert
  to anon, authenticated
  with check (true);
