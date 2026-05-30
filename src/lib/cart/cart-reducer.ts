import type { CartItem } from './types'

export type CartAction =
  | { type: 'ADD'; item: Omit<CartItem, 'qty'>; qty?: number }
  | { type: 'REMOVE'; id: string }
  | { type: 'SET_QTY'; id: string; qty: number }
  | { type: 'CLEAR' }

export function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'ADD': {
      const qty = action.qty ?? 1
      if (state.some(i => i.id === action.item.id)) {
        return state.map(i => (i.id === action.item.id ? { ...i, qty: i.qty + qty } : i))
      }
      return [...state, { ...action.item, qty }]
    }
    case 'REMOVE':
      return state.filter(i => i.id !== action.id)
    case 'SET_QTY':
      if (action.qty <= 0) return state.filter(i => i.id !== action.id)
      return state.map(i => (i.id === action.id ? { ...i, qty: action.qty } : i))
    case 'CLEAR':
      return []
    default:
      return state
  }
}
