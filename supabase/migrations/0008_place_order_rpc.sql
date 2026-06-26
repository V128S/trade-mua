-- 0008_place_order_rpc.sql
-- Wraps promo validation + order insert + promo redemption in a single atomic
-- transaction so promo codes can't be burned without a corresponding order,
-- and concurrent checkouts can't both redeem the same code.

create or replace function public.place_order(
  p_user_id    uuid,
  p_email      text,             -- user email for receipt
  p_items      jsonb,            -- OrderItem[] serialized
  p_total      numeric,
  p_promo_code text,             -- NULL or empty string = no promo
  p_first_name text,
  p_last_name  text,
  p_phone      text,
  p_city       text,
  p_branch     text,
  p_address    text,             -- legacy nova_poshta_address (single-line)
  p_notes      text              -- optional customer notes
)
returns uuid                     -- the new order id
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id   uuid;
  v_discount   numeric := 0;
  v_promo_code text    := nullif(trim(p_promo_code), '');
begin
  -- 1. Validate and lock the promo code inside the transaction.
  if v_promo_code is not null then
    select discount_pct into v_discount
    from public.promo_codes
    where code = v_promo_code
      and is_active = true
      and (expires_at is null or expires_at > now())
      and (max_uses is null or uses_count < max_uses)
    for update;                  -- row-level lock prevents concurrent redemptions

    if not found then
      raise exception 'INVALID_PROMO'
        using hint = 'Промокод недійсний або вичерпано ліміт';
    end if;
  end if;

  -- 2. Insert the order.
  insert into public.orders (
    user_id, recipient_email, items, total_usdt, status,
    promo_code, discount_pct,
    recipient_first_name, recipient_last_name, recipient_phone,
    city, nova_poshta_branch, nova_poshta_address, notes
  ) values (
    p_user_id, p_email, p_items, p_total, 'pending',
    v_promo_code, case when v_discount > 0 then v_discount else null end,
    p_first_name, p_last_name, p_phone,
    p_city, p_branch, p_address, nullif(p_notes, '')
  )
  returning id into v_order_id;

  -- 3. Consume the promo code now that the order exists.
  if v_promo_code is not null then
    update public.promo_codes
    set uses_count = uses_count + 1
    where code = v_promo_code;
  end if;

  return v_order_id;
end;
$$;

-- Only authenticated users (checkout flow) may call this.
revoke execute on function public.place_order(uuid, text, jsonb, numeric, text, text, text, text, text, text, text, text) from public, anon;
grant  execute on function public.place_order(uuid, text, jsonb, numeric, text, text, text, text, text, text, text, text) to authenticated;
