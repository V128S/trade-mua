-- 0006_random_products_rpc.sql
-- Replace the JS full-table shuffle in getRandomProductsFromDB with a DB-native
-- ORDER BY random() LIMIT n. Avoids fetching the entire products table to the
-- server on every similar-products panel render.
create or replace function public.random_products(n int)
  returns setof public.products
  language sql
  stable
  security definer
  set search_path = public
as $$
  select * from public.products order by random() limit n;
$$;

-- Only the application (anon/authenticated) needs to call this.
grant execute on function public.random_products(int) to anon, authenticated;
