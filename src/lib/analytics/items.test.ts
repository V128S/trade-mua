import { describe, expect, it } from 'vitest'
import { toGAItem, toGAItems, toGACartItems } from './items'

const product = {
  id: 'antminer-s21',
  name: 'Antminer S21',
  brand: 'Bitmain',
  algorithm: 'SHA-256',
  priceUSDT: 5000,
}

describe('toGAItem', () => {
  it('maps the core GA4 fields with quantity defaulting to 1', () => {
    expect(toGAItem(product)).toEqual({
      item_id: 'antminer-s21',
      item_name: 'Antminer S21',
      item_brand: 'Bitmain',
      item_category: 'SHA-256',
      price: 5000,
      quantity: 1,
    })
  })

  it('omits brand/category when absent (cart items)', () => {
    const item = toGAItem({ id: 'x', name: 'X', priceUSDT: 100 }, { quantity: 3 })
    expect(item).toEqual({ item_id: 'x', item_name: 'X', price: 100, quantity: 3 })
    expect('item_brand' in item).toBe(false)
    expect('item_category' in item).toBe(false)
  })

  it('adds list context and index when provided', () => {
    const item = toGAItem(product, { index: 2, listId: 'catalog', listName: 'Каталог' })
    expect(item.index).toBe(2)
    expect(item.item_list_id).toBe('catalog')
    expect(item.item_list_name).toBe('Каталог')
  })
})

describe('toGAItems', () => {
  it('assigns a 0-based index to each item', () => {
    const items = toGAItems([product, { id: 'b', name: 'B', priceUSDT: 1 }], { listId: 'home_top' })
    expect(items.map((i) => i.index)).toEqual([0, 1])
    expect(items.every((i) => i.item_list_id === 'home_top')).toBe(true)
  })
})

describe('toGACartItems', () => {
  it('uses each item per-line quantity', () => {
    const items = toGACartItems([
      { id: 'a', name: 'A', priceUSDT: 100, qty: 2 },
      { id: 'b', name: 'B', priceUSDT: 50, qty: 1 },
    ])
    expect(items.map((i) => i.quantity)).toEqual([2, 1])
  })
})
