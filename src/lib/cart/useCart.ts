'use client'
import { useSyncExternalStore } from 'react'
import {
  subscribe, getItems, getServerItems, getPromo, getServerPromo,
  getHydrated, getServerHydrated, cartActions,
} from './cart-store'
import { subtotal } from './cart-math'

export function useCart() {
  const items = useSyncExternalStore(subscribe, getItems, getServerItems)
  const promo = useSyncExternalStore(subscribe, getPromo, getServerPromo)
  const hydrated = useSyncExternalStore(subscribe, getHydrated, getServerHydrated)
  return {
    items,
    promo,
    hydrated,
    count: items.reduce((n, i) => n + i.qty, 0),
    subtotal: subtotal(items),
    ...cartActions,
  }
}
