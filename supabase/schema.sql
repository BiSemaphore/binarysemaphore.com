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

-- Lock the table down. The API route writes with the service-role key, which
-- bypasses row-level security; with RLS enabled and no policies, the anon and
-- authenticated roles can neither read nor write directly.
alter table public.contact_messages enable row level security;
