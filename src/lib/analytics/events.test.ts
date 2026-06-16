import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { trackAddToCart, trackPurchase, trackViewItemList } from './events'

let gtag: ReturnType<typeof vi.fn>

beforeEach(() => {
  gtag = vi.fn()
  ;(globalThis as { window?: unknown }).window = { gtag }
})
afterEach(() => {
  delete (globalThis as { window?: unknown }).window
})

const src = { id: 'a', name: 'A', brand: 'Bitmain', algorithm: 'SHA-256', priceUSDT: 100 }

describe('trackAddToCart', () => {
  it('reports USD value = price * qty with a single item', () => {
    trackAddToCart(src, 2)
    expect(gtag).toHaveBeenCalledWith('event', 'add_to_cart', {
      currency: 'USD',
      value: 200,
      items: [
        { item_id: 'a', item_name: 'A', item_brand: 'Bitmain', item_category: 'SHA-256', price: 100, quantity: 2 },
      ],
    })
  })
})

describe('trackPurchase', () => {
  it('sets transaction_id, USD value, coupon and per-line items', () => {
    trackPurchase({
      orderId: 'ord-1',
      items: [{ id: 'a', name: 'A', priceUSDT: 100, qty: 2 }],
      value: 180,
      coupon: 'SALE10',
    })
    const [, name, params] = gtag.mock.calls[0]
    expect(name).toBe('purchase')
    expect(params).toMatchObject({
      transaction_id: 'ord-1',
      currency: 'USD',
      value: 180,
      coupon: 'SALE10',
      shipping: 0,
      tax: 0,
    })
    expect((params as { items: unknown[] }).items).toHaveLength(1)
  })

  it('omits coupon when none is given', () => {
    trackPurchase({ orderId: 'ord-2', items: [], value: 0 })
    const params = gtag.mock.calls[0][2] as Record<string, unknown>
    expect('coupon' in params).toBe(false)
  })
})

describe('trackViewItemList', () => {
  it('passes the list id/name and indexed items', () => {
    trackViewItemList([src], { listId: 'catalog', listName: 'Каталог' })
    const params = gtag.mock.calls[0][2] as { item_list_id: string; items: { index: number }[] }
    expect(params.item_list_id).toBe('catalog')
    expect(params.items[0].index).toBe(0)
  })
})
