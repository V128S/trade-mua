// Pure mappers: domain product/cart shapes → GA4 Enhanced Ecommerce `items`.
// No browser access here, so this stays fully unit-testable in node.

export interface GAItem {
  item_id: string
  item_name: string
  item_brand?: string
  item_category?: string
  price: number
  quantity: number
  index?: number
  item_list_id?: string
  item_list_name?: string
}

// Minimal shape both Product (has brand/algorithm) and CartItem (does not)
// satisfy structurally.
export interface GAItemSource {
  id: string
  name: string
  brand?: string | null
  algorithm?: string | null
  priceUSDT: number
}

export interface GACartSource extends GAItemSource {
  qty: number
}

export interface GAItemOpts {
  quantity?: number
  index?: number
  listId?: string
  listName?: string
}

export function toGAItem(src: GAItemSource, opts: GAItemOpts = {}): GAItem {
  const item: GAItem = {
    item_id: src.id,
    item_name: src.name,
    price: src.priceUSDT,
    quantity: opts.quantity ?? 1,
  }
  if (src.brand) item.item_brand = src.brand
  if (src.algorithm) item.item_category = src.algorithm
  if (opts.index != null) item.index = opts.index
  if (opts.listId) item.item_list_id = opts.listId
  if (opts.listName) item.item_list_name = opts.listName
  return item
}

// List/select context: a single shared quantity (1) with a 0-based index.
export function toGAItems(
  srcs: GAItemSource[],
  opts: Omit<GAItemOpts, 'index' | 'quantity'> = {},
): GAItem[] {
  return srcs.map((s, i) => toGAItem(s, { ...opts, index: i }))
}

// Cart/checkout/purchase context: each line carries its own quantity.
export function toGACartItems(items: GACartSource[]): GAItem[] {
  return items.map((i) => toGAItem(i, { quantity: i.qty }))
}
