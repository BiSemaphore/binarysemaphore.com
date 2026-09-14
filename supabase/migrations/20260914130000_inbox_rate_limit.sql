-- A cap per email address on inbox messages: five in any 24 hours. The
-- address is already stored, so this counts data we hold and adds none.
-- It sits in the storing function because that is the only code path into
-- private.inbox, and the only place that can count.

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
  v_id     uuid;
  v_recent integer;
begin
  if char_length(p_name)  not between 1 and 200  then raise exception 'bad name';  end if;
  if char_length(p_email) not between 3 and 320  then raise exception 'bad email'; end if;
  if char_length(p_body)  not between 1 and 5000 then raise exception 'bad body';  end if;

  select count(*) into v_recent
  from private.inbox
  where lower(email) = lower(p_email)
    and created_at > now() - interval '24 hours';
  if v_recent >= 5 then
    raise exception 'too many messages from this address today';
  end if;

  insert into private.inbox (kind, name, email, body, context)
  values (p_kind, p_name, p_email, p_body, coalesce(p_context, '{}'::jsonb))
  returning id into v_id;

  return v_id;
end;
$$;
