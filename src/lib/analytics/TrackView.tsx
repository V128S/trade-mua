'use client'
import { useEffect, useRef } from 'react'
import { trackViewItem, trackViewItemList } from './events'
import type { GAItemSource } from './items'

// Server Components cannot call gtag (browser-only). These render nothing and
// fire a single GA4 event on mount, letting server pages emit impressions.

export function TrackProductView({ product }: { product: GAItemSource }) {
  const fired = useRef(false)
  useEffect(() => {
    if (fired.current) return
    fired.current = true
    trackViewItem(product)
  }, [product])
  return null
}

export function TrackItemList({
  products,
  listId,
  listName,
}: {
  products: GAItemSource[]
  listId: string
  listName: string
}) {
  const fired = useRef(false)
  useEffect(() => {
    if (fired.current) return
    fired.current = true
    trackViewItemList(products, { listId, listName })
  }, [products, listId, listName])
  return null
}
