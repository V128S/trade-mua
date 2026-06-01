import type { CartItem } from './types'
import type { OrderItem } from '@/lib/types/database.types'

export function subtotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.priceUSDT * i.qty, 0)
}

export function applyDiscount(amount: number, pct: number): number {
  if (pct <= 0) return amount
  return Math.round(amount * (1 - pct / 100) * 100) / 100
}

// Upper bound on a single line's quantity — guards against absurd or malformed
// client input creating a nonsensical order.
export const MAX_LINE_QTY = 999

export function buildOrderItems(
  lines: { id: string; qty: number }[],
  products: { id: string; name: string; priceUSDT: number }[],
): OrderItem[] {
  const byId = new Map(products.map(p => [p.id, p]))
  return lines.flatMap(line => {
    const p = byId.get(line.id)
    if (!p || !Number.isFinite(line.qty) || line.qty <= 0) return []
    const qty = Math.min(Math.floor(line.qty), MAX_LINE_QTY)
    return [{ product_id: p.id, name: p.name, price_usdt: p.priceUSDT, qty }]
  })
}
