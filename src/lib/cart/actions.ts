'use server'
import { createClient } from '@/lib/supabase/server'
import { buildOrderItems, applyDiscount } from '@/lib/cart/cart-math'
import { composeShippingAddress } from '@/lib/cart/shipping'
import { notifyDirectorNewOrder } from '@/lib/notify/telegram'
import { sendCustomerOrderEmail } from '@/lib/notify/email'
import { isCompleteUaPhone } from '@/lib/phone'

export async function previewPromo(code: string): Promise<{ discountPct: number } | { error: string }> {
  const trimmed = code.trim()
  if (!trimmed) return { error: 'Введіть промокод' }
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('validate_promo', { p_code: trimmed })
  if (error) return { error: 'Помилка перевірки' }
  if (data == null) return { error: 'Недійсний промокод' }
  return { discountPct: Number(data) }
}

export interface PlaceOrderInput {
  items: { id: string; qty: number }[]
  promoCode?: string | null
  firstName: string
  lastName: string
  phone: string
  city: string
  branch: string
  notes?: string
}

export async function placeOrder(input: PlaceOrderInput): Promise<{ orderId: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Потрібен вхід' }

  const firstName = input.firstName.trim()
  const lastName = input.lastName.trim()
  const phone = input.phone.trim()
  const city = input.city.trim()
  const branch = input.branch.trim()
  if (!firstName || !lastName || !phone || !city || !branch) {
    return { error: 'Заповніть усі обовʼязкові поля' }
  }
  if (!isCompleteUaPhone(phone)) {
    return { error: 'Введіть коректний номер телефону' }
  }

  const ids = input.items.map(i => i.id)
  if (ids.length === 0) return { error: 'Кошик порожній' }

  const { data: rows, error: prodErr } = await supabase
    .from('products')
    .select('id, name, price_usdt, image_url, image_url_admin, in_stock')
    .in('id', ids)
  if (prodErr) return { error: 'Не вдалося завантажити товари' }

  const products = (rows ?? []).map(r => ({
    id: r.id,
    name: r.name,
    priceUSDT: Number(r.price_usdt),
    imageUrl: r.image_url_admin ?? r.image_url,
    inStock: r.in_stock,
  }))
  const orderItems = buildOrderItems(input.items, products)
  if (orderItems.length === 0) return { error: 'Товари недоступні' }

  const base = orderItems.reduce((s, o) => s + o.price_usdt * o.qty, 0)

  const promoCode = input.promoCode?.trim().toUpperCase() || null
  // Discount is resolved inside place_order RPC; compute it here for notifications.
  let discountPct = 0
  if (promoCode) {
    const { data: pct } = await supabase.rpc('validate_promo', { p_code: promoCode })
    discountPct = pct != null ? Number(pct) : 0
  }

  const total = applyDiscount(base, discountPct)
  const notes = input.notes?.trim() || null

  // Single atomic RPC: validate promo + insert order + redeem promo.
  // Throws INVALID_PROMO if the code is invalid or exhausted.
  const { data: orderId, error: rpcErr } = await supabase.rpc('place_order', {
    p_user_id:    user.id,
    p_email:      user.email ?? null,
    p_items:      orderItems as unknown as Record<string, unknown>[],
    p_total:      total,
    p_promo_code: promoCode ?? '',
    p_first_name: firstName,
    p_last_name:  lastName,
    p_phone:      phone,
    p_city:       city,
    p_branch:     branch,
    p_address:    composeShippingAddress(city, branch),
    p_notes:      notes ?? '',
  })

  if (rpcErr) {
    if (rpcErr.message.includes('INVALID_PROMO')) return { error: 'Промокод недійсний або вичерпано ліміт' }
    console.error('[placeOrder] RPC failed:', rpcErr.message)
    return { error: 'Не вдалося створити замовлення' }
  }

  const order = { id: orderId as string }

  // Notify the director. The order is already persisted (the source of truth),
  // so a Telegram failure is logged and swallowed — it must not break checkout.
  try {
    await notifyDirectorNewOrder({
      id: order.id,
      items: orderItems,
      total,
      firstName,
      lastName,
      phone,
      city,
      branch,
      notes,
      promoCode,
      discountPct: discountPct || null,
    })
  } catch (e) {
    console.error('telegram notify failed', e)
  }

  try {
    await sendCustomerOrderEmail(
      {
        id: order.id,
        email: user.email ?? null,
        items: orderItems,
        total,
        firstName,
        lastName,
        city,
        branch,
        promoCode,
        discountPct: discountPct || null,
      },
      'placed',
    )
  } catch (e) {
    console.error('customer order email failed', e)
  }

  return { orderId: order.id }
}
