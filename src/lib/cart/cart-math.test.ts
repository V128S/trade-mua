import { describe, it, expect } from 'vitest'
import { subtotal, applyDiscount, buildOrderItems, MAX_LINE_QTY } from './cart-math'
import type { CartItem } from './types'

const item = (id: string, priceUSDT: number, qty: number): CartItem =>
  ({ id, name: id, hashrate: '', powerW: 0, priceUSDT, qty })

describe('subtotal', () => {
  it('sums price * qty', () => {
    expect(subtotal([item('a', 100, 2), item('b', 50, 1)])).toBe(250)
  })
  it('is 0 for empty cart', () => {
    expect(subtotal([])).toBe(0)
  })
})

describe('applyDiscount', () => {
  it('returns the amount unchanged for 0%', () => {
    expect(applyDiscount(250, 0)).toBe(250)
  })
  it('applies a percentage and rounds to cents', () => {
    expect(applyDiscount(99.99, 10)).toBe(89.99)
  })
})

describe('buildOrderItems', () => {
  const products = [
    { id: 'a', name: 'Antminer A', priceUSDT: 100 },
    { id: 'b', name: 'Antminer B', priceUSDT: 50 },
  ]
  it('maps cart lines to authoritative order items', () => {
    expect(buildOrderItems([{ id: 'a', qty: 2 }], products)).toEqual([
      { product_id: 'a', name: 'Antminer A', price_usdt: 100, qty: 2, image_url: null },
    ])
  })
  it('carries the product image_url into the order item', () => {
    const withImg = [{ id: 'a', name: 'Antminer A', priceUSDT: 100, imageUrl: 'https://cdn/x.webp' }]
    expect(buildOrderItems([{ id: 'a', qty: 1 }], withImg)).toEqual([
      { product_id: 'a', name: 'Antminer A', price_usdt: 100, qty: 1, image_url: 'https://cdn/x.webp' },
    ])
  })
  it('skips unknown products and non-positive quantities', () => {
    expect(buildOrderItems([{ id: 'x', qty: 1 }, { id: 'b', qty: 0 }], products)).toEqual([])
  })
  it('caps quantity at MAX_LINE_QTY and floors non-integers', () => {
    expect(buildOrderItems([{ id: 'a', qty: 100000 }], products)).toEqual([
      { product_id: 'a', name: 'Antminer A', price_usdt: 100, qty: MAX_LINE_QTY, image_url: null },
    ])
    expect(buildOrderItems([{ id: 'a', qty: 2.9 }], products)).toEqual([
      { product_id: 'a', name: 'Antminer A', price_usdt: 100, qty: 2, image_url: null },
    ])
  })
  it('skips NaN/Infinity quantities', () => {
    expect(buildOrderItems([{ id: 'a', qty: NaN }, { id: 'b', qty: Infinity }], products)).toEqual([])
  })
})
