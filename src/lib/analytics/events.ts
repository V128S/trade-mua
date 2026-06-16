import { gtagEvent } from './gtag'
import { toGAItem, toGAItems, toGACartItems, type GAItemSource, type GACartSource } from './items'

const CURRENCY = 'USD'

type ListCtx = { listId: string; listName: string }

export function trackViewItemList(srcs: GAItemSource[], ctx: ListCtx): void {
  gtagEvent('view_item_list', {
    item_list_id: ctx.listId,
    item_list_name: ctx.listName,
    items: toGAItems(srcs, { listId: ctx.listId, listName: ctx.listName }),
  })
}

export function trackSelectItem(src: GAItemSource, ctx: ListCtx & { index?: number }): void {
  gtagEvent('select_item', {
    item_list_id: ctx.listId,
    item_list_name: ctx.listName,
    items: [toGAItem(src, { listId: ctx.listId, listName: ctx.listName, index: ctx.index })],
  })
}

export function trackViewItem(src: GAItemSource): void {
  gtagEvent('view_item', { currency: CURRENCY, value: src.priceUSDT, items: [toGAItem(src)] })
}

export function trackAddToCart(src: GAItemSource, qty = 1): void {
  gtagEvent('add_to_cart', {
    currency: CURRENCY,
    value: src.priceUSDT * qty,
    items: [toGAItem(src, { quantity: qty })],
  })
}

export function trackRemoveFromCart(src: GAItemSource, qty = 1): void {
  gtagEvent('remove_from_cart', {
    currency: CURRENCY,
    value: src.priceUSDT * qty,
    items: [toGAItem(src, { quantity: qty })],
  })
}

export function trackViewCart(items: GACartSource[], value: number): void {
  gtagEvent('view_cart', { currency: CURRENCY, value, items: toGACartItems(items) })
}

type CheckoutOpts = { value: number; coupon?: string | null }

export function trackBeginCheckout(items: GACartSource[], opts: CheckoutOpts): void {
  gtagEvent('begin_checkout', {
    currency: CURRENCY,
    value: opts.value,
    ...(opts.coupon ? { coupon: opts.coupon } : {}),
    items: toGACartItems(items),
  })
}

export function trackAddShippingInfo(items: GACartSource[], opts: CheckoutOpts): void {
  gtagEvent('add_shipping_info', {
    currency: CURRENCY,
    value: opts.value,
    shipping_tier: 'Nova Poshta',
    ...(opts.coupon ? { coupon: opts.coupon } : {}),
    items: toGACartItems(items),
  })
}

export function trackPurchase(order: {
  orderId: string
  items: GACartSource[]
  value: number
  coupon?: string | null
}): void {
  gtagEvent('purchase', {
    transaction_id: order.orderId,
    currency: CURRENCY,
    value: order.value,
    shipping: 0,
    tax: 0,
    ...(order.coupon ? { coupon: order.coupon } : {}),
    items: toGACartItems(order.items),
  })
}
