-- 0005_function_grants_indexes_storage.sql

-- handle_new_user is an auth.users INSERT trigger — never called directly.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Promo + cancel RPCs are only ever invoked from server actions running as the
-- signed-in user. Remove anon access (kills anonymous promo-code enumeration via
-- /rest/v1/rpc/validate_promo); keep authenticated.
revoke execute on function public.validate_promo(text) from public, anon;
grant  execute on function public.validate_promo(text) to authenticated;

revoke execute on function public.redeem_promo(text) from public, anon;
grant  execute on function public.redeem_promo(text) to authenticated;

revoke execute on function public.cancel_order(uuid) from public, anon;
grant  execute on function public.cancel_order(uuid) to authenticated;

-- Cover the orders.user_id foreign key (dashboard reads filter by user_id).
create index if not exists idx_orders_user_id on public.orders (user_id);

-- Public bucket object URLs work without a broad SELECT (list) policy.
-- Dropping it stops clients enumerating every file in `avatars`.
drop policy if exists public_read_avatars on storage.objects;
