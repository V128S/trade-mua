# GA4 E-commerce события — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Покрыть всю e-commerce воронку TradeMua стандартными GA4-событиями (view_item_list, select_item, view_item, add_to_cart, remove_from_cart, view_cart, begin_checkout, add_shipping_info, purchase) из централизованного типизированного модуля.

**Architecture:** Новый модуль `src/lib/analytics/` с тремя слоями: guard-хелпер `gtagEvent` (единственная точка контакта с `window.gtag`, никогда не бросает), чистые мапперы `Product/CartItem → GA4 item` (юнит-тестируемые в node-окружении) и типизированные функции событий. Серверные страницы эмитят события через тонкие клиентские компоненты-обёртки (`TrackView.tsx`). Цены репортятся как `currency: 'USD'`.

**Tech Stack:** Next.js 16 (App Router) + React 19 + TypeScript, vitest (env `node`), gtag.js (уже подключён в `layout.tsx`, prod-only, `lazyOnload`).

**Spec:** `docs/superpowers/specs/2026-06-16-ga4-ecommerce-events-design.md`

---

## File Structure

**Создаём:**
- `src/lib/analytics/gtag.d.ts` — ambient-типизация `Window.gtag` / `dataLayer`.
- `src/lib/analytics/gtag.ts` — `gtagEvent(name, params)` (guard + try/catch + dev-лог).
- `src/lib/analytics/gtag.test.ts` — тесты guard-хелпера.
- `src/lib/analytics/items.ts` — мапперы `toGAItem` / `toGAItems` / `toGACartItems`.
- `src/lib/analytics/items.test.ts` — тесты мапперов.
- `src/lib/analytics/events.ts` — 9 типизированных функций событий.
- `src/lib/analytics/events.test.ts` — выборочные тесты событий.
- `src/lib/analytics/index.ts` — публичный ре-экспорт.
- `src/lib/analytics/TrackView.tsx` — клиентские обёртки `TrackProductView` / `TrackItemList` для серверных страниц.

**Модифицируем:**
- `src/components/cart/AddToCartButton.tsx` — `add_to_cart` (+ расширить Props до `brand`/`algorithm`).
- `src/components/products/ProductCard.tsx` — `select_item` (+ опц. props списка).
- `src/app/[locale]/products/[slug]/page.tsx` — `<TrackProductView>` (view_item).
- `src/app/[locale]/page.tsx` — `<TrackItemList>` для топ-рейла + list-контекст карточек.
- `src/app/[locale]/asic/[algorithm]/page.tsx` — `<TrackItemList>` + list-контекст карточек.
- `src/components/products/ProductsCatalog.tsx` — `view_item_list` + list-контекст карточек.
- `src/components/cart/CartView.tsx` — `view_cart` + `remove_from_cart`.
- `src/components/cart/CheckoutForm.tsx` — `begin_checkout` + `add_shipping_info` + `purchase`.

**Соглашение по тестам:** репозиторий тестирует только чистую логику (vitest, env `node`); инфраструктуры компонентных тестов (RTL/jsdom) нет и она вне скоупа. Поэтому Tasks 1–3 (модуль) идут по TDD, а wiring-задачи (4–9) проверяются типчеком (`npx tsc --noEmit`) + линтом + ручной верификацией в GA4 DebugView (финальный Task 10).

---

## Task 1: gtag-типы и guard-хелпер

**Files:**
- Create: `src/lib/analytics/gtag.d.ts`
- Create: `src/lib/analytics/gtag.ts`
- Test: `src/lib/analytics/gtag.test.ts`

- [ ] **Step 1: Написать падающий тест**

`src/lib/analytics/gtag.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest'
import { gtagEvent } from './gtag'

// vitest env is `node`, so there is no `window`. We attach/detach a fake one
// on globalThis to exercise both the guarded no-op path and the forward path.
afterEach(() => {
  delete (globalThis as { window?: unknown }).window
})

describe('gtagEvent', () => {
  it('is a no-op (does not throw) when window is absent', () => {
    expect(() => gtagEvent('view_item', { value: 1 })).not.toThrow()
  })

  it('forwards to window.gtag with the GA event signature', () => {
    const spy = vi.fn()
    ;(globalThis as { window?: unknown }).window = { gtag: spy }
    gtagEvent('add_to_cart', { value: 10 })
    expect(spy).toHaveBeenCalledWith('event', 'add_to_cart', { value: 10 })
  })

  it('swallows errors thrown by gtag', () => {
    ;(globalThis as { window?: unknown }).window = {
      gtag: () => {
        throw new Error('boom')
      },
    }
    expect(() => gtagEvent('purchase', {})).not.toThrow()
  })
})
```

- [ ] **Step 2: Запустить тест — должен упасть**

Run: `npm test -- src/lib/analytics/gtag.test.ts`
Expected: FAIL — `Cannot find module './gtag'` / `gtagEvent is not a function`.

- [ ] **Step 3: Добавить типизацию `window.gtag`**

`src/lib/analytics/gtag.d.ts`:

```ts
// Ambient typing for the gtag.js function injected by the GA <Script> in
// src/app/[locale]/layout.tsx. Without this, window.gtag is untyped.
export {}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}
```

- [ ] **Step 4: Реализовать guard-хелпер**

`src/lib/analytics/gtag.ts`:

```ts
// The single low-level entry point for every GA4 event. Guards on browser +
// gtag presence so calls are safe on the server, in dev (GA is prod-only) and
// before the lazyOnload GA script has loaded. Never throws — analytics must
// never break UX.
const DEBUG = process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === '1'

export function gtagEvent(name: string, params: Record<string, unknown>): void {
  if (DEBUG) {
    // Visible in dev, where GA itself does not load.
    console.debug('[ga]', name, params)
  }
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  try {
    window.gtag('event', name, params)
  } catch (err) {
    console.error('[ga] event failed', name, err)
  }
}
```

- [ ] **Step 5: Запустить тест — должен пройти**

Run: `npm test -- src/lib/analytics/gtag.test.ts`
Expected: PASS (3 теста).

- [ ] **Step 6: Коммит**

```bash
git add src/lib/analytics/gtag.d.ts src/lib/analytics/gtag.ts src/lib/analytics/gtag.test.ts
git commit -m "feat(analytics): GA4 gtagEvent guard helper + window.gtag types"
```

---

## Task 2: Мапперы GA4 item

**Files:**
- Create: `src/lib/analytics/items.ts`
- Test: `src/lib/analytics/items.test.ts`

- [ ] **Step 1: Написать падающий тест**

`src/lib/analytics/items.test.ts`:

```ts
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
    expect(items.map(i => i.index)).toEqual([0, 1])
    expect(items.every(i => i.item_list_id === 'home_top')).toBe(true)
  })
})

describe('toGACartItems', () => {
  it('uses each item per-line quantity', () => {
    const items = toGACartItems([
      { id: 'a', name: 'A', priceUSDT: 100, qty: 2 },
      { id: 'b', name: 'B', priceUSDT: 50, qty: 1 },
    ])
    expect(items.map(i => i.quantity)).toEqual([2, 1])
  })
})
```

- [ ] **Step 2: Запустить тест — должен упасть**

Run: `npm test -- src/lib/analytics/items.test.ts`
Expected: FAIL — `Cannot find module './items'`.

- [ ] **Step 3: Реализовать мапперы**

`src/lib/analytics/items.ts`:

```ts
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
  return items.map(i => toGAItem(i, { quantity: i.qty }))
}
```

- [ ] **Step 4: Запустить тест — должен пройти**

Run: `npm test -- src/lib/analytics/items.test.ts`
Expected: PASS.

- [ ] **Step 5: Коммит**

```bash
git add src/lib/analytics/items.ts src/lib/analytics/items.test.ts
git commit -m "feat(analytics): pure Product/CartItem → GA4 item mappers"
```

---

## Task 3: Типизированные функции событий + публичный API

**Files:**
- Create: `src/lib/analytics/events.ts`
- Create: `src/lib/analytics/index.ts`
- Test: `src/lib/analytics/events.test.ts`

- [ ] **Step 1: Написать падающий тест**

`src/lib/analytics/events.test.ts`:

```ts
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
      items: [{ item_id: 'a', item_name: 'A', item_brand: 'Bitmain', item_category: 'SHA-256', price: 100, quantity: 2 }],
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
    expect(params).toMatchObject({ transaction_id: 'ord-1', currency: 'USD', value: 180, coupon: 'SALE10', shipping: 0, tax: 0 })
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
```

- [ ] **Step 2: Запустить тест — должен упасть**

Run: `npm test -- src/lib/analytics/events.test.ts`
Expected: FAIL — `Cannot find module './events'`.

- [ ] **Step 3: Реализовать события**

`src/lib/analytics/events.ts`:

```ts
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
  gtagEvent('add_to_cart', { currency: CURRENCY, value: src.priceUSDT * qty, items: [toGAItem(src, { quantity: qty })] })
}

export function trackRemoveFromCart(src: GAItemSource, qty = 1): void {
  gtagEvent('remove_from_cart', { currency: CURRENCY, value: src.priceUSDT * qty, items: [toGAItem(src, { quantity: qty })] })
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
```

`src/lib/analytics/index.ts`:

```ts
export * from './events'
export type { GAItem, GAItemSource, GACartSource } from './items'
```

- [ ] **Step 4: Запустить тест — должен пройти**

Run: `npm test -- src/lib/analytics/events.test.ts`
Expected: PASS.

- [ ] **Step 5: Прогнать весь модуль + типчек**

Run: `npm test -- src/lib/analytics && npx tsc --noEmit`
Expected: все тесты зелёные, типчек без ошибок.

- [ ] **Step 6: Коммит**

```bash
git add src/lib/analytics/events.ts src/lib/analytics/index.ts src/lib/analytics/events.test.ts
git commit -m "feat(analytics): typed GA4 e-commerce event functions"
```

---

## Task 4: Клиентские обёртки для серверных страниц

**Files:**
- Create: `src/lib/analytics/TrackView.tsx`

- [ ] **Step 1: Реализовать обёртки**

`src/lib/analytics/TrackView.tsx`:

```tsx
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
```

- [ ] **Step 2: Типчек**

Run: `npx tsc --noEmit`
Expected: без ошибок.

- [ ] **Step 3: Коммит**

```bash
git add src/lib/analytics/TrackView.tsx
git commit -m "feat(analytics): TrackProductView/TrackItemList client wrappers"
```

---

## Task 5: `add_to_cart` в AddToCartButton

**Files:**
- Modify: `src/components/cart/AddToCartButton.tsx`

- [ ] **Step 1: Расширить Props и вызвать событие**

В `src/components/cart/AddToCartButton.tsx` добавить импорт и `brand`/`algorithm` в Props, затем вызвать `trackAddToCart` в `handleAdd`.

Заменить строку импорта типа Product (после `import { useCart }`):

```tsx
import { useCart } from '@/lib/cart/useCart'
import { trackAddToCart } from '@/lib/analytics'
import type { Product } from '@/lib/sheets'

type Props = { product: Pick<Product, 'id' | 'name' | 'brand' | 'algorithm' | 'hashrate' | 'powerW' | 'priceUSDT' | 'inStock' | 'imageUrl'> }
```

В `handleAdd`, сразу после `add({...})` (до `setAdded(true)`), добавить:

```tsx
    trackAddToCart(
      { id: product.id, name: product.name, brand: product.brand, algorithm: product.algorithm, priceUSDT: product.priceUSDT },
      1,
    )
```

Вызов на странице товара (`products/[slug]/page.tsx:303`) передаёт полный `Product`, поэтому `brand`/`algorithm` уже доступны — правка вызова не нужна.

- [ ] **Step 2: Типчек + линт**

Run: `npx tsc --noEmit && npm run lint`
Expected: без ошибок.

- [ ] **Step 3: Коммит**

```bash
git add src/components/cart/AddToCartButton.tsx
git commit -m "feat(analytics): fire add_to_cart on AddToCartButton"
```

---

## Task 6: `select_item` в ProductCard

**Files:**
- Modify: `src/components/products/ProductCard.tsx`

- [ ] **Step 1: Добавить опц. props списка и onClick**

В `src/components/products/ProductCard.tsx` добавить импорт:

```tsx
import { trackSelectItem } from "@/lib/analytics";
```

Расширить сигнатуру компонента (добавить `listId`, `listName`, `index`):

```tsx
export function ProductCard({
  product,
  revenuePerTH = 0,
  compact = false,
  listId,
  listName,
  index,
}: {
  product: Product;
  revenuePerTH?: number;
  compact?: boolean;
  listId?: string;
  listName?: string;
  index?: number;
}) {
```

На корневом `<Link href={`/products/${product.id}`} ...>` добавить обработчик:

```tsx
    <Link
      href={`/products/${product.id}`}
      onClick={() => {
        if (listId && listName) {
          trackSelectItem(
            { id: product.id, name: product.name, brand: product.brand, algorithm: product.algorithm, priceUSDT: product.priceUSDT },
            { listId, listName, index },
          );
        }
      }}
      className="glass glass-hover group overflow-hidden flex flex-col"
    >
```

(Карточки без list-контекста просто не шлют `select_item` — событие опционально.)

- [ ] **Step 2: Типчек + линт**

Run: `npx tsc --noEmit && npm run lint`
Expected: без ошибок.

- [ ] **Step 3: Коммит**

```bash
git add src/components/products/ProductCard.tsx
git commit -m "feat(analytics): fire select_item from ProductCard with list context"
```

---

## Task 7: `view_item` + `view_item_list` + list-контекст на страницах

**Files:**
- Modify: `src/app/[locale]/products/[slug]/page.tsx`
- Modify: `src/app/[locale]/page.tsx`
- Modify: `src/app/[locale]/asic/[algorithm]/page.tsx`
- Modify: `src/components/products/ProductsCatalog.tsx`

- [ ] **Step 1: view_item на странице товара**

В `src/app/[locale]/products/[slug]/page.tsx` добавить импорт рядом с другими (около строки 11):

```tsx
import { TrackProductView } from "@/lib/analytics/TrackView";
```

Сразу после `<AddToCartButton product={product} />` (строка 303) добавить:

```tsx
              <TrackProductView product={product} />
```

- [ ] **Step 2: Топ-рейл главной — view_item_list + list-контекст**

В `src/app/[locale]/page.tsx` добавить импорт (около строки 9):

```tsx
import { TrackItemList } from "@/lib/analytics/TrackView";
```

Найти рейл топ-продуктов (`<ProductCard key={p.id} product={p} />`, строка ~202) и:
- добавить list-контекст в карточку: `index`, `listId`, `listName`;
- после `.map(...)` грид-контейнера добавить `<TrackItemList>`.

Заменить рендер карточек (показан паттерн — `topProducts` это массив, переданный в `.map`):

```tsx
              {topProducts.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} listId="home_top" listName="Топ ASIC на головній" />
              ))}
```

И сразу после закрывающего тега грида с этими карточками добавить:

```tsx
            <TrackItemList products={topProducts} listId="home_top" listName="Топ ASIC на головній" />
```

> Примечание исполнителю: имя переменной массива в `page.tsx` — то, что передаётся в `.map` для топ-рейла (от `getShuffledTopProductsFromDB`). Подставить фактическое имя (напр. `topProducts`) единообразно в обоих местах.

- [ ] **Step 3: ASIC-хаб — view_item_list + list-контекст**

В `src/app/[locale]/asic/[algorithm]/page.tsx` добавить импорт (около строки 7):

```tsx
import { TrackItemList } from "@/lib/analytics/TrackView";
```

Заменить рендер карточек (строка ~141):

```tsx
          {products.map((p, i) => (
            <ProductCard
              key={p.id}
              product={p}
              revenuePerTH={revenueMap[p.algorithm]?.revenuePerTH ?? 0}
              index={i}
              listId={`asic_${hub}`}
              listName={`ASIC: ${hubTitle}`}
            />
          ))}
```

> Примечание исполнителю: `hub`/`hubTitle` — подставить фактические переменные слага и заголовка хаба, доступные в этом компоненте (см. конфиг `HUBS`). Если удобного заголовка нет — использовать слаг: `listName={`ASIC ${algorithm}`}`.

Сразу после грида добавить:

```tsx
        <TrackItemList products={products} listId={`asic_${hub}`} listName={`ASIC: ${hubTitle}`} />
```

- [ ] **Step 4: Каталог — view_item_list (client) + list-контекст**

В `src/components/products/ProductsCatalog.tsx`:

Добавить импорты:

```tsx
import { useRef } from "react";
import { trackViewItemList } from "@/lib/analytics";
```

(`useState, useEffect` уже импортированы — добавить `useRef` в существующий импорт из `react`.)

Внутри компонента, рядом с другими хуками, добавить разовый выстрел `view_item_list` по первой странице видимых товаров:

```tsx
  const listFired = useRef(false);
  useEffect(() => {
    if (listFired.current || visibleProducts.length === 0) return;
    listFired.current = true;
    trackViewItemList(visibleProducts, { listId: "catalog", listName: "Каталог" });
  }, [visibleProducts]);
```

Заменить рендер карточек (строка ~141–142), добавив list-контекст:

```tsx
                {visibleProducts.map((p, i) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    revenuePerTH={revenueByAlgo[p.algorithm] ?? 0}
                    index={i}
                    listId="catalog"
                    listName="Каталог"
                  />
                ))}
```

> Примечание исполнителю: сохранить существующие props карточки (`revenuePerTH`/иные) как в текущем коде — добавить только `index`/`listId`/`listName`.

- [ ] **Step 5: Типчек + линт + сборка**

Run: `npx tsc --noEmit && npm run lint`
Expected: без ошибок.

- [ ] **Step 6: Коммит**

```bash
git add src/app/[locale]/products/[slug]/page.tsx src/app/[locale]/page.tsx src/app/[locale]/asic/[algorithm]/page.tsx src/components/products/ProductsCatalog.tsx
git commit -m "feat(analytics): fire view_item + view_item_list across product surfaces"
```

---

## Task 8: `view_cart` + `remove_from_cart` в CartView

**Files:**
- Modify: `src/components/cart/CartView.tsx`

- [ ] **Step 1: Добавить события**

В `src/components/cart/CartView.tsx` добавить импорты:

```tsx
import { useEffect, useRef, useState } from 'react'
import { trackRemoveFromCart, trackViewCart } from '@/lib/analytics'
```

(`useState` уже импортирован — объединить в один импорт из `react` с `useEffect`, `useRef`.)

После строки с `useCart()` и вычислением, добавить разовый `view_cart` на маунт (когда корзина гидрирована и непуста):

```tsx
  const viewFired = useRef(false)
  useEffect(() => {
    if (viewFired.current || !hydrated || items.length === 0) return
    viewFired.current = true
    trackViewCart(items, subtotal)
  }, [hydrated, items, subtotal])
```

В кнопке удаления строки (`onClick={() => remove(i.id)}`) добавить выстрел `remove_from_cart` с полным количеством строки:

```tsx
                <button
                  type="button"
                  onClick={() => {
                    trackRemoveFromCart(i, i.qty)
                    remove(i.id)
                  }}
                  className="font-label-caps text-[10px] text-on-surface-variant hover:text-red-400 uppercase tracking-widest transition-colors"
                >
                  {t('remove')}
                </button>
```

(`i` — это `CartItem` со всеми полями `GACartSource`; `i.qty` — количество в строке. Декремент кнопками −/+ не инструментируем — это явное удаление строки.)

- [ ] **Step 2: Типчек + линт**

Run: `npx tsc --noEmit && npm run lint`
Expected: без ошибок.

- [ ] **Step 3: Коммит**

```bash
git add src/components/cart/CartView.tsx
git commit -m "feat(analytics): fire view_cart + remove_from_cart in CartView"
```

---

## Task 9: `begin_checkout` + `add_shipping_info` + `purchase` в CheckoutForm

**Files:**
- Modify: `src/components/cart/CheckoutForm.tsx`

- [ ] **Step 1: Добавить импорты и события**

В `src/components/cart/CheckoutForm.tsx`:

Расширить импорт react и добавить события:

```tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { trackAddShippingInfo, trackBeginCheckout, trackPurchase } from '@/lib/analytics'
```

После вычисления `const total = ...` добавить разовый `begin_checkout` на маунт (когда корзина гидрирована и непуста):

```tsx
  const beginFired = useRef(false)
  useEffect(() => {
    if (beginFired.current || !hydrated || items.length === 0) return
    beginFired.current = true
    trackBeginCheckout(items, { value: total, coupon: promo?.code })
  }, [hydrated, items, total, promo])
```

В `handleSubmit`, сразу после `setError(null)` и **до** вызова `placeOrder`, добавить `add_shipping_info`:

```tsx
    trackAddShippingInfo(items, { value: total, coupon: promo?.code })
```

В `handleSubmit`, после успешного результата и **до** `clear()` (между `if ('error' in res) {...}` и `clear()`), добавить `purchase`:

```tsx
    trackPurchase({ orderId: res.orderId, items, value: total, coupon: promo?.code })
    clear()
    router.push(`/dashboard/orders?success=${res.orderId}`)
```

(`items` здесь — `CartItem[]`, совместим с `GACartSource`. `purchase` шлётся ровно один раз — до очистки корзины и редиректа.)

- [ ] **Step 2: Типчек + линт**

Run: `npx tsc --noEmit && npm run lint`
Expected: без ошибок.

- [ ] **Step 3: Коммит**

```bash
git add src/components/cart/CheckoutForm.tsx
git commit -m "feat(analytics): fire begin_checkout/add_shipping_info/purchase in checkout"
```

---

## Task 10: Финальная верификация

**Files:** —

- [ ] **Step 1: Полный прогон тестов**

Run: `npm test`
Expected: все тесты зелёные (включая существующие + новые в `src/lib/analytics`).

- [ ] **Step 2: Линт + типчек + прод-сборка**

Run: `npm run lint && npx tsc --noEmit && npm run build`
Expected: без ошибок, сборка успешна.

- [ ] **Step 3: Ручная верификация в GA4 DebugView (документировать)**

Прогон по воронке с открытым GA4 DebugView (или dev с `NEXT_PUBLIC_ANALYTICS_DEBUG=1` и проверкой `console.debug('[ga]', ...)`):

1. Открыть каталог → `view_item_list` (`item_list_id: catalog`).
2. Кликнуть карточку → `select_item`.
3. Страница товара → `view_item` (с `currency: USD`, `value`).
4. «В кошик» → `add_to_cart`.
5. `/cart` → `view_cart`; удалить строку → `remove_from_cart`.
6. `/checkout` (маунт) → `begin_checkout`.
7. Сабмит → `add_shipping_info`, затем `purchase` (`transaction_id` = id заказа, `value` = total).
8. Проверить, что `purchase` не дублируется на `/dashboard/orders?success=…`.

- [ ] **Step 4: Финальный коммит (если были правки на шаге 3)**

```bash
git add -A
git commit -m "chore(analytics): GA4 e-commerce funnel verified end-to-end"
```

---

## Self-Review (выполнено при написании плана)

- **Покрытие спеки:** все 9 событий → Tasks 5–9; модуль (gtag/items/events/index/TrackView) → Tasks 1–4; тесты на мапперы/guard/события → Tasks 1–3; критерии готовности → Task 10. ✔
- **Плейсхолдеры:** код приведён в каждом шаге; два «примечания исполнителю» (имя массива топ-рейла, переменные `hub`/`hubTitle`) — это указания подставить фактические идентификаторы из существующего кода, не пропуски логики. ✔
- **Консистентность типов:** `GAItemSource`/`GACartSource`/`GAItem` и сигнатуры `track*` совпадают между Tasks 2–3 и местами вызова (5–9); `currency: 'USD'` единообразно. ✔
