-- Signing in grants access. It does not expire.
--
-- These notebooks expand lectures by someone else, credited on every notebook
-- page. Charging for that, or dangling a countdown that ends in a payment
-- prompt, is not a thing to do with another person's teaching. The gate stays,
-- because an account is what makes a download belong to somebody, but the
-- clock and the price go.
--
-- Existing grants have their expiry cleared, so nobody who is part-way through
-- a notebook is cut off by this change.

update public.entitlements
set expires_at = null
where expires_at is not null;

-- Replaces start_learn_trial. Same shape, same security-definer reasoning: the
-- row is written server-side so a client cannot forge one. It simply no longer
-- computes an expiry.
create or replace function public.grant_learn_access(p_product_id text)
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
    select 1 from public.learn_products p
    where p.id = p_product_id and p.active
  ) then
    raise exception 'unknown notebook: %', p_product_id using errcode = '22023';
  end if;

  insert into public.entitlements (user_id, product_id, status, source, expires_at)
  values (v_user, p_product_id, 'active', 'account', null)
  on conflict (user_id, product_id) do nothing
  returning * into v_row;

  if v_row.id is null then
    select * into v_row
    from public.entitlements e
    where e.user_id = v_user and e.product_id = p_product_id;
  end if;

  return v_row;
end;
$$;

revoke execute on function public.grant_learn_access(text) from public, anon;
grant execute on function public.grant_learn_access(text) to authenticated;

drop function if exists public.start_learn_trial(text);
