-- Inbox retention: the privacy page promises contact and mentorship messages
-- are deleted 12 months after they arrive. This makes that true in the
-- database rather than in a note somebody has to remember.
--
-- pg_cron runs inside Postgres, so there is no external scheduler to keep
-- alive. The job runs daily at 03:10 UTC and deletes by created_at only:
-- status is irrelevant, an answered message is still personal data.

create extension if not exists pg_cron with schema pg_catalog;

create or replace function private.purge_old_inbox()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  removed integer;
begin
  delete from private.inbox where created_at < now() - interval '12 months';
  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke all on function private.purge_old_inbox() from public;

-- Idempotent: unschedule any earlier copy before scheduling.
do $$
begin
  perform cron.unschedule('purge-old-inbox')
  where exists (select 1 from cron.job where jobname = 'purge-old-inbox');
end;
$$;

select cron.schedule('purge-old-inbox', '10 3 * * *', $$select private.purge_old_inbox()$$);
