-- Cart & checkout: allow users to create their own orders, and add
-- promo validation/redemption functions used by the checkout flow.
-- Applied to project flukkrmmurzuluozumav on 2026-05-30.

-- Allow an authenticated user to insert only their own order.
drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own"
  on public.orders
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Read-only promo validation (used for the cart preview; no side effects).
create or replace function public.validate_promo(p_code text)
returns numeric
language sql
security definer
set search_path = public
as $$
  select discount_pct
  from public.promo_codes
  where upper(code) = upper(p_code)
    and is_active = true
    and (expires_at is null or expires_at > now())
    and (max_uses is null or uses_count < max_uses)
  limit 1;
$$;

-- Atomic redeem: re-validates and increments uses_count in one statement
-- (the WHERE clause + row lock makes the counter race-safe). Returns the
-- discount_pct, or null if the code is invalid/expired/over-limit.
create or replace function public.redeem_promo(p_code text)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pct numeric;
begin
  update public.promo_codes
     set uses_count = uses_count + 1
   where upper(code) = upper(p_code)
     and is_active = true
     and (expires_at is null or expires_at > now())
     and (max_uses is null or uses_count < max_uses)
  returning discount_pct into v_pct;
  return v_pct;
end;
$$;

grant execute on function public.validate_promo(text) to anon, authenticated;
grant execute on function public.redeem_promo(text) to authenticated;
