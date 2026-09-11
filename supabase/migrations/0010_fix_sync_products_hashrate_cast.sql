-- 0010_fix_sync_products_hashrate_cast.sql
-- sync_products() (0007) cast hashrate to ::numeric, but products.hashrate is
-- text ("104 TH/s", "20 GH/s" — used verbatim throughout the app and parsed
-- via parseHashrateTH()). Any hashrate value fails the numeric cast with
-- "invalid input syntax for type numeric", breaking every sync. Fix: cast to
-- ::text like the other text columns (algorithm, brand, name).

create or replace function public.sync_products(
  rows     jsonb,     -- array of product objects (same shape as the products table)
  keep_ids text[]     -- ids present in the latest Sheet pull; everything else is deleted
)
returns int           -- number of rows remaining after sync
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Upsert all rows from the Sheet pull.
  insert into public.products (
    id, algorithm, brand, name, hashrate, power_w,
    price_usdt, in_stock, is_new, image_url, synced_at
  )
  select
    (r->>'id')::text,
    (r->>'algorithm')::text,
    (r->>'brand')::text,
    (r->>'name')::text,
    (r->>'hashrate')::text,
    (r->>'power_w')::int,
    (r->>'price_usdt')::numeric,
    (r->>'in_stock')::boolean,
    (r->>'is_new')::boolean,
    (r->>'image_url')::text,
    (r->>'synced_at')::timestamptz
  from jsonb_array_elements(rows) as r
  on conflict (id) do update set
    algorithm  = excluded.algorithm,
    brand      = excluded.brand,
    name       = excluded.name,
    hashrate   = excluded.hashrate,
    power_w    = excluded.power_w,
    price_usdt = excluded.price_usdt,
    in_stock   = excluded.in_stock,
    is_new     = excluded.is_new,
    image_url  = excluded.image_url,
    synced_at  = excluded.synced_at;

  -- Delete products no longer present in the Sheet.
  -- image_url_admin is preserved because we only delete entire rows that
  -- are absent from keep_ids; rows still in keep_ids keep all their columns.
  delete from public.products where id <> all(keep_ids);

  return (select count(*)::int from public.products);
end;
$$;

-- Only the service role (server-side sync) should call this function.
revoke execute on function public.sync_products(jsonb, text[]) from public, anon, authenticated;
