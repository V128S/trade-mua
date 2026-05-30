'use server'
import { createClient } from '@/lib/supabase/server'
import { buildOrderItems, applyDiscount } from '@/lib/cart/cart-math'

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
  novaPoshta: string
  phone: string
  notes?: string
}

export async function placeOrder(input: PlaceOrderInput): Promise<{ orderId: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Потрібен вхід' }

  const ids = input.items.map(i => i.id)
  if (ids.length === 0) return { error: 'Кошик порожній' }

  const { data: rows, error: prodErr } = await supabase
    .from('products')
    .select('id, name, price_usdt')
    .in('id', ids)
  if (prodErr) return { error: 'Не вдалося завантажити товари' }

  const products = (rows ?? []).map(r => ({ id: r.id, name: r.name, priceUSDT: Number(r.price_usdt) }))
  const orderItems = buildOrderItems(input.items, products)
  if (orderItems.length === 0) return { error: 'Товари недоступні' }

  const base = orderItems.reduce((s, o) => s + o.price_usdt * o.qty, 0)

  let discountPct = 0
  let promoCode: string | null = null
  if (input.promoCode?.trim()) {
    const { data: pct, error: promoErr } = await supabase.rpc('redeem_promo', { p_code: input.promoCode.trim() })
    if (promoErr) return { error: 'Помилка промокоду' }
    if (pct == null) return { error: 'Недійсний промокод' }
    discountPct = Number(pct)
    promoCode = input.promoCode.trim().toUpperCase()
  }

  const total = applyDiscount(base, discountPct)

  // The orders table has no phone column — fold the contact phone into notes
  // so the operator sees it on the order (order-as-request flow).
  const phone = input.phone.trim()
  const notes = [phone ? `Телефон: ${phone}` : '', input.notes?.trim() ?? '']
    .filter(Boolean)
    .join('\n') || null

  const { data: order, error: insErr } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      items: orderItems,
      total_usdt: total,
      status: 'pending',
      promo_code: promoCode,
      discount_pct: discountPct || null,
      nova_poshta_address: input.novaPoshta,
      notes,
    })
    .select('id')
    .single()

  if (insErr || !order) return { error: 'Не вдалося створити замовлення' }
  return { orderId: order.id }
}
