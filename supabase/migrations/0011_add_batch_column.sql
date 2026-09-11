-- 0011_add_batch_column.sql
-- Adds the supply-batch column: a model can ship in multiple delivery
-- batches (e.g. "(Dec)"/"(Jan)"/"(Mar)" in the Sheet's model column), same
-- spec, different price. Parsed out in src/lib/sheets.ts, stored here so the
-- product detail page can offer a batch selector alongside the existing
-- hashrate config selector.

alter table public.products add column if not exists batch text;

-- Redefine sync_products() (0007, fixed for hashrate in 0010) to also
-- upsert the new column.
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
    price_usdt, in_stock, is_new, image_url, batch, synced_at
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
    (r->>'batch')::text,
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
    batch      = excluded.batch,
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
