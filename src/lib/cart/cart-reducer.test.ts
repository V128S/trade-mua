import { describe, it, expect } from 'vitest'
import { cartReducer } from './cart-reducer'
import type { CartItem } from './types'

const base: Omit<CartItem, 'qty'> = { id: 'a', name: 'A', hashrate: '335 TH/s', powerW: 5360, priceUSDT: 8500 }

describe('cartReducer', () => {
  it('ADD inserts a new line with qty 1 by default', () => {
    expect(cartReducer([], { type: 'ADD', item: base })).toEqual([{ ...base, qty: 1 }])
  })
  it('ADD merges quantity for an existing id', () => {
    const state = [{ ...base, qty: 1 }]
    expect(cartReducer(state, { type: 'ADD', item: base, qty: 2 })).toEqual([{ ...base, qty: 3 }])
  })
  it('SET_QTY updates quantity', () => {
    const state = [{ ...base, qty: 1 }]
    expect(cartReducer(state, { type: 'SET_QTY', id: 'a', qty: 5 })).toEqual([{ ...base, qty: 5 }])
  })
  it('SET_QTY to 0 removes the line', () => {
    const state = [{ ...base, qty: 1 }]
    expect(cartReducer(state, { type: 'SET_QTY', id: 'a', qty: 0 })).toEqual([])
  })
  it('REMOVE deletes the line', () => {
    const state = [{ ...base, qty: 1 }]
    expect(cartReducer(state, { type: 'REMOVE', id: 'a' })).toEqual([])
  })
  it('CLEAR empties the cart', () => {
    expect(cartReducer([{ ...base, qty: 1 }], { type: 'CLEAR' })).toEqual([])
  })
})
