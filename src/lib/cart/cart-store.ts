import type { CartItem } from './types'
import { cartReducer, type CartAction } from './cart-reducer'

const ITEMS_KEY = 'cart_v1'
const PROMO_KEY = 'cart_promo_v1'
const EMPTY_ITEMS: CartItem[] = []

export interface AppliedPromo { code: string; pct: number }

let items: CartItem[] = EMPTY_ITEMS
let promo: AppliedPromo | null = null
let hydrated = false
const listeners = new Set<() => void>()

function emit() { listeners.forEach(l => l()) }

function loadItems(): CartItem[] {
  try { const raw = localStorage.getItem(ITEMS_KEY); return raw ? (JSON.parse(raw) as CartItem[]) : EMPTY_ITEMS }
  catch { return EMPTY_ITEMS }
}
function loadPromo(): AppliedPromo | null {
  try { const raw = localStorage.getItem(PROMO_KEY); return raw ? (JSON.parse(raw) as AppliedPromo) : null }
  catch { return null }
}

function ensureInit() {
  if (hydrated || typeof window === 'undefined') return
  items = loadItems()
  promo = loadPromo()
  hydrated = true
  window.addEventListener('storage', e => {
    if (e.key === ITEMS_KEY) { items = loadItems(); emit() }
    if (e.key === PROMO_KEY) { promo = loadPromo(); emit() }
  })
}

function persistItems() { try { localStorage.setItem(ITEMS_KEY, JSON.stringify(items)) } catch {} }
function persistPromo() {
  try { promo ? localStorage.setItem(PROMO_KEY, JSON.stringify(promo)) : localStorage.removeItem(PROMO_KEY) } catch {}
}

function apply(action: CartAction) {
  ensureInit()
  items = cartReducer(items, action)
  persistItems()
  emit()
}

export function subscribe(listener: () => void) {
  ensureInit()
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export const getItems = () => items
export const getServerItems = () => EMPTY_ITEMS
export const getPromo = () => promo
export const getServerPromo = (): AppliedPromo | null => null
export const getHydrated = () => hydrated
export const getServerHydrated = () => false

export const cartActions = {
  add: (item: Omit<CartItem, 'qty'>, qty = 1) => apply({ type: 'ADD', item, qty }),
  remove: (id: string) => apply({ type: 'REMOVE', id }),
  setQty: (id: string, qty: number) => apply({ type: 'SET_QTY', id, qty }),
  setPromo: (p: AppliedPromo) => { ensureInit(); promo = p; persistPromo(); emit() },
  clearPromo: () => { ensureInit(); promo = null; persistPromo(); emit() },
  clear: () => { ensureInit(); items = EMPTY_ITEMS; promo = null; persistItems(); persistPromo(); emit() },
}
