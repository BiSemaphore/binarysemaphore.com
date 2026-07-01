-- Address Supabase Security Advisor warnings that originate from our schema.
-- Safe to re-run (idempotent).

-- 1) "Function Search Path Mutable" on public.set_updated_at.
-- Pin the function to security invoker with an empty search_path so it can't be
-- hijacked by a caller's search_path. now() is in pg_catalog (always resolved).
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

-- 2) "RLS Policy Always True" on public.contact_messages.
-- Replace `with check (true)` with bounded validation. Still an open, insert-only
-- public form (anon + authenticated), but the payload must be non-empty and sane.
drop policy if exists "Anyone can submit a contact message" on public.contact_messages;
create policy "Anyone can submit a contact message"
  on public.contact_messages
  for insert
  to anon, authenticated
  with check (
    char_length(name) between 1 and 200
    and char_length(email) between 3 and 320
    and char_length(message) between 1 and 5000
  );

-- Note: warnings for public.rls_auto_enable() (SECURITY DEFINER, world-executable)
-- are NOT from this repo — that function was created directly in the dashboard.
-- If it is unused, drop it in the SQL editor after confirming:
--   drop function if exists public.rls_auto_enable();
-- Or, to keep it but stop anon/authenticated from executing it:
--   revoke execute on function public.rls_auto_enable() from anon, authenticated, public;
--
-- "Leaked Password Protection Disabled" is an Auth setting (Authentication ->
-- Policies): a dashboard toggle, low risk here since sign-in is OAuth-only.
