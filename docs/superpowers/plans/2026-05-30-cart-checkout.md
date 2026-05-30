# Cart & Checkout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static `/cart` stub with a working cart and a checkout flow that creates a real `orders` row (order-as-request, no payment), with optional promo-code discounts.

**Architecture:** Cart state lives in a client-side module store backed by `localStorage`, read via `useSyncExternalStore` (avoids the repo's `react-hooks/set-state-in-effect` lint gate — same pattern already used for theme/lang in the navbar). Pure cart math is unit-tested with Vitest (TDD). Checkout requires login; a `placeOrder` Server Action recomputes the total from the DB (never trusts client prices) and redeems promo codes via a `security definer` Postgres function. RLS lets a user insert only their own order.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase (`@supabase/ssr`), Tailwind 4, Vitest.

**Spec:** `docs/superpowers/specs/2026-05-30-cart-checkout-design.md`

---

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/cart/types.ts` | `CartItem` type |
| `src/lib/cart/cart-math.ts` | Pure: `subtotal`, `applyDiscount`, `buildOrderItems` (tested) |
| `src/lib/cart/cart-reducer.ts` | Pure: `cartReducer` for item mutations (tested) |
| `src/lib/cart/cart-store.ts` | Module store: state + localStorage + subscribe/snapshots + mutators |
| `src/lib/cart/useCart.ts` | `useCart()` hook over the store via `useSyncExternalStore` |
| `src/lib/cart/actions.ts` | Server Actions: `previewPromo`, `placeOrder` |
| `src/components/cart/AddToCartButton.tsx` | Client button on product page |
| `src/components/cart/CartView.tsx` | Client `/cart` UI (items, qty, remove, summary, promo) |
| `src/components/cart/CheckoutForm.tsx` | Client checkout form → `placeOrder` |
| `src/app/cart/page.tsx` | Renders `CartView` (replaces stub) |
| `src/app/checkout/page.tsx` | Server: auth + profile prefill → renders `CheckoutForm` |
| `supabase/migrations/0001_cart_checkout.sql` | `orders` INSERT RLS + `validate_promo` + `redeem_promo` |
| `src/lib/types/database.types.ts` | Add `Functions` typings for the two RPCs |
| `src/components/layout/Navbar.tsx` | Cart count badge |
| `src/components/auth/LoginForm.tsx` | Honor `?redirect` after login |
| `src/middleware.ts` | Protect `/checkout` |

---

## Task 1: Vitest setup + cart-math (TDD)

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/lib/cart/types.ts`
- Test: `src/lib/cart/cart-math.test.ts`
- Create: `src/lib/cart/cart-math.ts`

- [ ] **Step 1: Install Vitest**

Run: `npm i -D vitest`
Expected: added to devDependencies, no errors.

- [ ] **Step 2: Add test scripts to `package.json`**

In the `"scripts"` block add:
```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
})
```

- [ ] **Step 4: Create `src/lib/cart/types.ts`**

```ts
export interface CartItem {
  id: string
  name: string
  hashrate: string
  powerW: number
  priceUSDT: number
  qty: number
}
```

- [ ] **Step 5: Write the failing test `src/lib/cart/cart-math.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { subtotal, applyDiscount, buildOrderItems } from './cart-math'
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
      { product_id: 'a', name: 'Antminer A', price_usdt: 100, qty: 2 },
    ])
  })
  it('skips unknown products and non-positive quantities', () => {
    expect(buildOrderItems([{ id: 'x', qty: 1 }, { id: 'b', qty: 0 }], products)).toEqual([])
  })
})
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot find module `./cart-math` / exports undefined.

- [ ] **Step 7: Implement `src/lib/cart/cart-math.ts`**

```ts
import type { CartItem } from './types'
import type { OrderItem } from '@/lib/types/database.types'

export function subtotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.priceUSDT * i.qty, 0)
}

export function applyDiscount(amount: number, pct: number): number {
  if (pct <= 0) return amount
  return Math.round(amount * (1 - pct / 100) * 100) / 100
}

export function buildOrderItems(
  lines: { id: string; qty: number }[],
  products: { id: string; name: string; priceUSDT: number }[],
): OrderItem[] {
  const byId = new Map(products.map(p => [p.id, p]))
  return lines.flatMap(line => {
    const p = byId.get(line.id)
    if (!p || line.qty <= 0) return []
    return [{ product_id: p.id, name: p.name, price_usdt: p.priceUSDT, qty: line.qty }]
  })
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — all 6 assertions green.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/lib/cart/types.ts src/lib/cart/cart-math.ts src/lib/cart/cart-math.test.ts
git commit -m "feat(cart): add vitest + pure cart math (subtotal, discount, order items)"
```

---

## Task 2: cart-reducer (TDD)

**Files:**
- Test: `src/lib/cart/cart-reducer.test.ts`
- Create: `src/lib/cart/cart-reducer.ts`

- [ ] **Step 1: Write the failing test `src/lib/cart/cart-reducer.test.ts`**

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot find module `./cart-reducer`.

- [ ] **Step 3: Implement `src/lib/cart/cart-reducer.ts`**

```ts
import type { CartItem } from './types'

export type CartAction =
  | { type: 'ADD'; item: Omit<CartItem, 'qty'>; qty?: number }
  | { type: 'REMOVE'; id: string }
  | { type: 'SET_QTY'; id: string; qty: number }
  | { type: 'CLEAR' }
  | { type: 'HYDRATE'; items: CartItem[] }

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
    case 'HYDRATE':
      return action.items
    default:
      return state
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — 6 assertions green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/cart/cart-reducer.ts src/lib/cart/cart-reducer.test.ts
git commit -m "feat(cart): add cart reducer (add/remove/set-qty/clear) with tests"
```

---

## Task 3: Cart store + useCart hook

**Files:**
- Create: `src/lib/cart/cart-store.ts`
- Create: `src/lib/cart/useCart.ts`

- [ ] **Step 1: Create `src/lib/cart/cart-store.ts`**

Module singleton. `promo` is stored alongside items so it survives the `/cart` → `/checkout` navigation. Snapshots return stable references (only reassigned on change) as required by `useSyncExternalStore`.

```ts
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
```

- [ ] **Step 2: Create `src/lib/cart/useCart.ts`**

```ts
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
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/lib/cart/cart-store.ts src/lib/cart/useCart.ts
git commit -m "feat(cart): localStorage-backed cart store + useCart (useSyncExternalStore)"
```

---

## Task 4: Navbar cart count badge

**Files:**
- Modify: `src/components/layout/Navbar.tsx`

- [ ] **Step 1: Import the hook**

At the top of `src/components/layout/Navbar.tsx`, add after the existing imports:
```tsx
import { useCart } from "@/lib/cart/useCart";
```

- [ ] **Step 2: Find every cart link**

Run: `grep -n 'href="/cart"' src/components/layout/Navbar.tsx`
Expected: one or more lines (desktop ~256, possibly a mobile one). Apply Steps 3–4 to each component that renders a `/cart` link.

- [ ] **Step 3: Read the count in the component**

In each component function that renders a `/cart` link, add near the other hooks:
```tsx
const { count, hydrated } = useCart();
```

- [ ] **Step 4: Render the badge**

Replace the cart `<Link>` (the one at ~256) with:
```tsx
<Link href="/cart" aria-label="Кошик" className="relative w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors duration-200">
  <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
  {hydrated && count > 0 && (
    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-primary text-[#0e0e0a] text-[10px] font-technical-data flex items-center justify-center">
      {count}
    </span>
  )}
</Link>
```
(For a mobile cart link with different classes, keep its classes but add `relative` and the same badge block.)

- [ ] **Step 5: Verify lint + build**

Run: `npx eslint src/components/layout/Navbar.tsx && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/Navbar.tsx
git commit -m "feat(cart): show item count badge on navbar cart icon"
```

---

## Task 5: Add-to-cart button on product page

**Files:**
- Create: `src/components/cart/AddToCartButton.tsx`
- Modify: `src/app/products/[slug]/page.tsx` (the button block at ~152–156)

- [ ] **Step 1: Create `src/components/cart/AddToCartButton.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { useCart } from '@/lib/cart/useCart'
import type { Product } from '@/lib/sheets'

type Props = { product: Pick<Product, 'id' | 'name' | 'hashrate' | 'powerW' | 'priceUSDT' | 'inStock'> }

export default function AddToCartButton({ product }: Props) {
  const { add } = useCart()
  const [added, setAdded] = useState(false)

  function handleAdd() {
    add({
      id: product.id,
      name: product.name,
      hashrate: product.hashrate,
      powerW: product.powerW,
      priceUSDT: product.priceUSDT,
    })
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1500)
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      className="btn-primary py-4 px-8 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-transform"
    >
      <span className="material-symbols-outlined text-[18px]">{added ? 'check' : 'shopping_cart'}</span>
      {added ? 'Додано' : product.inStock ? 'Додати в кошик' : 'Замовити'}
    </button>
  )
}
```

- [ ] **Step 2: Import it in the product page**

In `src/app/products/[slug]/page.tsx`, add to the imports:
```tsx
import AddToCartButton from "@/components/cart/AddToCartButton";
```

- [ ] **Step 3: Replace the "Додати в кошик" link**

Find this block (~152–156):
```tsx
              <Link href="/contact" className="btn-primary py-4 px-8 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-transform">
                <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                {product.inStock ? "Додати в кошик" : "Замовити"}
              </Link>
```
Replace it with:
```tsx
              <AddToCartButton product={product} />
```
Leave the second "Консультація" link (→ `/contact`) unchanged.

- [ ] **Step 4: Verify build**

Run: `npx tsc --noEmit && npx eslint src/components/cart/AddToCartButton.tsx src/app/products/[slug]/page.tsx`
Expected: 0 errors.

- [ ] **Step 5: Manual check**

Run `npm run dev`, open a product page, click "Додати в кошик". Expected: button flips to "Додано" then back; navbar badge shows 1; reload page → badge persists.

- [ ] **Step 6: Commit**

```bash
git add src/components/cart/AddToCartButton.tsx "src/app/products/[slug]/page.tsx"
git commit -m "feat(cart): add-to-cart button on product detail page"
```

---

## Task 6: Working cart page (items, qty, remove, subtotal)

Promo UI is added in Task 8. This task builds the item list + summary + checkout link.

**Files:**
- Create: `src/components/cart/CartView.tsx`
- Modify: `src/app/cart/page.tsx`

- [ ] **Step 1: Create `src/components/cart/CartView.tsx`**

```tsx
'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/lib/cart/useCart'
import { getProductImage } from '@/lib/product-images'

export default function CartView() {
  const { items, hydrated, subtotal, setQty, remove } = useCart()

  if (!hydrated) return <div className="py-24" />

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center text-center gap-8 py-12">
        <span className="material-symbols-outlined text-outline-variant text-[80px]">shopping_cart</span>
        <div className="space-y-2">
          <h1 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest">Кошик порожній</h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
            Додайте товари з каталогу або зв&apos;яжіться з нами напряму — ми підберемо найкращий варіант.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/products" className="btn-primary py-4 px-8 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">inventory_2</span>
            Перейти до каталогу
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
      {/* Items */}
      <div className="space-y-4">
        {items.map(i => {
          const img = getProductImage(i.name)
          return (
            <div key={i.id} className="bg-card border-card rounded-lg p-4 flex gap-4 items-center">
              <div className="relative w-20 h-20 bg-white rounded shrink-0 flex items-center justify-center overflow-hidden">
                {img ? (
                  <Image src={img} alt={i.name} width={72} height={72} className="object-contain" />
                ) : (
                  <span className="material-symbols-outlined text-outline-variant text-[32px]">memory</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/products/${i.id}`} className="font-technical-data text-technical-data text-on-surface hover:text-primary transition-colors block truncate">
                  {i.name}
                </Link>
                <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">
                  {i.hashrate ? `${i.hashrate} · ` : ''}{i.powerW} W
                </p>
                <p className="font-headline-md text-headline-md text-primary mt-1">${i.priceUSDT.toLocaleString()}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center border border-[#2e2d2b] rounded">
                  <button type="button" aria-label="Зменшити" onClick={() => setQty(i.id, i.qty - 1)} className="w-8 h-8 text-on-surface-variant hover:text-primary">−</button>
                  <span className="w-8 text-center font-technical-data text-technical-data text-on-surface">{i.qty}</span>
                  <button type="button" aria-label="Збільшити" onClick={() => setQty(i.id, i.qty + 1)} className="w-8 h-8 text-on-surface-variant hover:text-primary">+</button>
                </div>
                <button type="button" onClick={() => remove(i.id)} className="font-label-caps text-[10px] text-on-surface-variant hover:text-red-400 uppercase tracking-widest transition-colors">
                  Видалити
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="bg-card border-card rounded-lg p-6 space-y-4 lg:sticky lg:top-24">
        <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest text-base">Разом</h2>
        <div className="flex justify-between font-body-md text-body-md text-on-surface-variant">
          <span>Сума</span>
          <span className="text-on-surface font-technical-data">${subtotal.toLocaleString()}</span>
        </div>
        <Link href="/checkout" className="btn-primary w-full py-3 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center justify-center gap-2">
          Перейти до оформлення
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Replace `src/app/cart/page.tsx`**

```tsx
import type { Metadata } from "next";
import CartView from "@/components/cart/CartView";

export const metadata: Metadata = {
  title: "Кошик | Trade M",
};

export default function CartPage() {
  return (
    <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-16 pb-section-gap">
      <CartView />
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit && npx eslint src/components/cart/CartView.tsx src/app/cart/page.tsx`
Expected: 0 errors.

- [ ] **Step 4: Manual check**

Add 2 products, open `/cart`. Expected: both lines show; `+`/`−` change qty and subtotal; setting qty to 0 (via `−`) removes the line; "Видалити" removes; navbar badge tracks the total.

- [ ] **Step 5: Commit**

```bash
git add src/components/cart/CartView.tsx src/app/cart/page.tsx
git commit -m "feat(cart): working cart page with qty stepper, remove, and subtotal"
```

---

## Task 7: Supabase migration — RLS + promo functions

**Files:**
- Create: `supabase/migrations/0001_cart_checkout.sql`
- Modify: `src/lib/types/database.types.ts` (the `Functions` block)

- [ ] **Step 1: Create `supabase/migrations/0001_cart_checkout.sql`**

```sql
-- Allow an authenticated user to insert only their own order.
alter table public.orders enable row level security;

drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own"
  on public.orders
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Read-only promo validation (used for the cart preview; no side effects).
create or replace function public.validate_promo(p_code text)
returns numeric
language sql
security definer
set search_path = public
as $$
  select discount_pct
  from public.promo_codes
  where upper(code) = upper(p_code)
    and is_active = true
    and (expires_at is null or expires_at > now())
    and (max_uses is null or uses_count < max_uses)
  limit 1;
$$;

-- Atomic redeem: re-validates and increments uses_count in one statement
-- (the WHERE clause + row lock makes the counter race-safe). Returns the
-- discount_pct, or null if the code is invalid/expired/over-limit.
create or replace function public.redeem_promo(p_code text)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pct numeric;
begin
  update public.promo_codes
     set uses_count = uses_count + 1
   where upper(code) = upper(p_code)
     and is_active = true
     and (expires_at is null or expires_at > now())
     and (max_uses is null or uses_count < max_uses)
  returning discount_pct into v_pct;
  return v_pct;
end;
$$;

grant execute on function public.validate_promo(text) to anon, authenticated;
grant execute on function public.redeem_promo(text) to authenticated;
```

- [ ] **Step 2: Apply the migration**

Apply via the Supabase MCP `apply_migration` tool (name `cart_checkout`, the SQL above) against the linked project, or paste the SQL into the Supabase dashboard SQL editor and run it.
Expected: success, no errors. (If `orders` already had RLS enabled the `alter` is a harmless no-op.)

- [ ] **Step 3: Verify the policy and functions exist**

Run this SQL (MCP `execute_sql` or dashboard):
```sql
select polname from pg_policies where tablename = 'orders' and polname = 'orders_insert_own';
select proname from pg_proc where proname in ('validate_promo', 'redeem_promo');
```
Expected: one policy row + two function rows.

- [ ] **Step 4: Add `Functions` typings in `src/lib/types/database.types.ts`**

Replace the line:
```ts
    Functions: Record<string, never>
```
with:
```ts
    Functions: {
      validate_promo: { Args: { p_code: string }; Returns: number }
      redeem_promo: { Args: { p_code: string }; Returns: number }
    }
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/0001_cart_checkout.sql src/lib/types/database.types.ts
git commit -m "feat(checkout): orders insert RLS + validate_promo/redeem_promo functions"
```

---

## Task 8: Promo code on the cart + previewPromo action

**Files:**
- Create: `src/lib/cart/actions.ts` (the `previewPromo` action; `placeOrder` is added in Task 9)
- Modify: `src/components/cart/CartView.tsx` (promo field + discounted total)

- [ ] **Step 1: Create `src/lib/cart/actions.ts`**

```ts
'use server'
import { createClient } from '@/lib/supabase/server'

export async function previewPromo(code: string): Promise<{ discountPct: number } | { error: string }> {
  const trimmed = code.trim()
  if (!trimmed) return { error: 'Введіть промокод' }
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('validate_promo', { p_code: trimmed })
  if (error) return { error: 'Помилка перевірки' }
  if (data == null) return { error: 'Недійсний промокод' }
  return { discountPct: Number(data) }
}
```

- [ ] **Step 2: Add the promo UI to `CartView.tsx`**

Add to the hook destructure at the top of the component:
```tsx
const { items, hydrated, subtotal, setQty, remove, promo, setPromo, clearPromo } = useCart()
```
Add these imports at the top of the file:
```tsx
import { useState } from 'react'
import { previewPromo } from '@/lib/cart/actions'
import { applyDiscount } from '@/lib/cart/cart-math'
```
Inside the component (before `return`), add local state and the apply handler:
```tsx
  const [code, setCode] = useState('')
  const [promoError, setPromoError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  async function handleApplyPromo() {
    setChecking(true)
    setPromoError(null)
    const res = await previewPromo(code)
    setChecking(false)
    if ('error' in res) { setPromoError(res.error); clearPromo(); return }
    setPromo({ code: code.trim().toUpperCase(), pct: res.discountPct })
  }

  const total = promo ? applyDiscount(subtotal, promo.pct) : subtotal
```
In the summary block, between the "Сума" row and the checkout `<Link>`, insert:
```tsx
        {/* Promo */}
        <div className="space-y-2">
          {promo ? (
            <div className="flex justify-between items-center font-body-md text-body-md">
              <span className="text-on-surface-variant">Промокод <span className="text-primary font-technical-data">{promo.code}</span> (−{promo.pct}%)</span>
              <button type="button" onClick={() => { clearPromo(); setCode(''); }} className="material-symbols-outlined text-[16px] text-on-surface-variant hover:text-red-400">close</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="Промокод"
                className="flex-1 min-w-0 bg-surface border border-[#2e2d2b] rounded px-3 py-2 font-technical-data text-technical-data text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/60"
              />
              <button type="button" onClick={handleApplyPromo} disabled={checking} className="btn-ghost px-4 rounded font-label-caps text-label-caps uppercase tracking-widest text-xs disabled:opacity-50">
                {checking ? '...' : 'Застос.'}
              </button>
            </div>
          )}
          {promoError && <p className="font-label-caps text-[10px] text-red-400">{promoError}</p>}
        </div>

        {promo && (
          <div className="flex justify-between font-body-md text-body-md text-on-surface border-t border-[#2e2d2b] pt-3">
            <span className="uppercase font-label-caps tracking-widest text-[11px]">Разом</span>
            <span className="font-headline-md text-headline-md text-primary">${total.toLocaleString()}</span>
          </div>
        )}
```

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit && npx eslint src/lib/cart/actions.ts src/components/cart/CartView.tsx`
Expected: 0 errors.

- [ ] **Step 4: Manual check**

Create a promo code in the admin panel (`/admin/promos`), e.g. `TEST10` at 10%. On `/cart`, enter `test10` → applies, shows −10% and discounted total. Enter a bad code → "Недійсний промокод". Confirm `uses_count` did NOT change in the DB (preview only).

- [ ] **Step 5: Commit**

```bash
git add src/lib/cart/actions.ts src/components/cart/CartView.tsx
git commit -m "feat(cart): apply promo code preview with discounted total"
```

---

## Task 9: placeOrder Server Action

**Files:**
- Modify: `src/lib/cart/actions.ts` (add `placeOrder`)

- [ ] **Step 1: Add `placeOrder` to `src/lib/cart/actions.ts`**

Add these imports at the top of the file:
```ts
import { buildOrderItems, subtotal as sumItems, applyDiscount } from '@/lib/cart/cart-math'
```
Append the action:
```ts
export interface PlaceOrderInput {
  items: { id: string; qty: number }[]
  promoCode?: string | null
  novaPoshta: string
  phone: string
  notes?: string
}

export async function placeOrder(input: PlaceOrderInput): Promise<{ orderId: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Потрібен вхід' }

  const ids = input.items.map(i => i.id)
  if (ids.length === 0) return { error: 'Кошик порожній' }

  const { data: rows, error: prodErr } = await supabase
    .from('products')
    .select('id, name, price_usdt')
    .in('id', ids)
  if (prodErr) return { error: 'Не вдалося завантажити товари' }

  const products = (rows ?? []).map(r => ({ id: r.id, name: r.name, priceUSDT: Number(r.price_usdt) }))
  const orderItems = buildOrderItems(input.items, products)
  if (orderItems.length === 0) return { error: 'Товари недоступні' }

  const base = sumItems(orderItems.map(o => ({ id: o.product_id, name: o.name, hashrate: '', powerW: 0, priceUSDT: o.price_usdt, qty: o.qty })))

  let discountPct = 0
  let promoCode: string | null = null
  if (input.promoCode?.trim()) {
    const { data: pct, error: promoErr } = await supabase.rpc('redeem_promo', { p_code: input.promoCode.trim() })
    if (promoErr) return { error: 'Помилка промокоду' }
    if (pct == null) return { error: 'Недійсний промокод' }
    discountPct = Number(pct)
    promoCode = input.promoCode.trim().toUpperCase()
  }

  const total = applyDiscount(base, discountPct)

  const { data: order, error: insErr } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      items: orderItems,
      total_usdt: total,
      status: 'pending',
      promo_code: promoCode,
      discount_pct: discountPct || null,
      nova_poshta_address: input.novaPoshta,
      notes: input.notes ?? null,
    })
    .select('id')
    .single()

  if (insErr || !order) return { error: 'Не вдалося створити замовлення' }
  return { orderId: order.id }
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0. (The `orders` Insert type accepts these fields; `OrderItem[]` matches `items`.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/cart/actions.ts
git commit -m "feat(checkout): placeOrder action — recompute total from DB, redeem promo, insert order"
```

---

## Task 10: Checkout page + middleware + login redirect

**Files:**
- Modify: `src/middleware.ts`
- Modify: `src/components/auth/LoginForm.tsx`
- Create: `src/components/cart/CheckoutForm.tsx`
- Create: `src/app/checkout/page.tsx`

- [ ] **Step 1: Protect `/checkout` in `src/middleware.ts`**

In the redirect condition, add `/checkout`:
```ts
  if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/checkout'))) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
```
And add `/checkout` to the `matcher` array:
```ts
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/admin',
    '/admin/:path*',
    '/checkout',
  ],
```

- [ ] **Step 2: Honor `?redirect` in `src/components/auth/LoginForm.tsx`**

Add the import:
```tsx
import { useSearchParams } from 'next/navigation'
```
Inside the component, add:
```tsx
  const searchParams = useSearchParams()
```
Replace the success redirect line:
```tsx
    window.location.href = '/dashboard'
```
with:
```tsx
    const redirect = searchParams.get('redirect')
    window.location.href = redirect && redirect.startsWith('/') ? redirect : '/dashboard'
```

- [ ] **Step 3: Create `src/components/cart/CheckoutForm.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/lib/cart/useCart'
import { applyDiscount } from '@/lib/cart/cart-math'
import { placeOrder } from '@/lib/cart/actions'

export default function CheckoutForm({ defaultPhone }: { defaultPhone: string }) {
  const { items, promo, subtotal, hydrated, clear } = useCart()
  const router = useRouter()
  const [novaPoshta, setNovaPoshta] = useState('')
  const [phone, setPhone] = useState(defaultPhone)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (hydrated && items.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="font-body-md text-body-md text-on-surface-variant">Кошик порожній.</p>
        <Link href="/products" className="btn-primary inline-flex py-3 px-6 rounded font-label-caps text-label-caps uppercase tracking-widest">До каталогу</Link>
      </div>
    )
  }

  const total = promo ? applyDiscount(subtotal, promo.pct) : subtotal

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await placeOrder({
      items: items.map(i => ({ id: i.id, qty: i.qty })),
      promoCode: promo?.code ?? null,
      novaPoshta,
      phone,
      notes,
    })
    if ('error' in res) { setError(res.error); setLoading(false); return }
    clear()
    router.push(`/dashboard/orders?success=${res.orderId}`)
  }

  const field = "w-full bg-surface border border-[#2e2d2b] rounded px-4 py-2.5 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary/60 transition-colors"
  const label = "font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest block mb-1.5 text-[11px]"

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={label}>Відділення Нової Пошти</label>
          <input value={novaPoshta} onChange={e => setNovaPoshta(e.target.value)} required placeholder="Місто, № відділення" className={field} />
        </div>
        <div>
          <label className={label}>Телефон</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+380..." className={field} />
        </div>
        <div>
          <label className={label}>Коментар (необов&apos;язково)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={field} />
        </div>
        {error && <p className="font-body-md text-body-md text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full py-3 rounded font-label-caps text-label-caps uppercase tracking-widest disabled:opacity-50">
          {loading ? 'Оформлення...' : 'Підтвердити замовлення'}
        </button>
      </form>

      <div className="bg-card border-card rounded-lg p-6 space-y-3 lg:sticky lg:top-24">
        <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest text-base">Замовлення</h2>
        {items.map(i => (
          <div key={i.id} className="flex justify-between gap-2 font-body-md text-sm text-on-surface-variant">
            <span className="truncate">{i.name} × {i.qty}</span>
            <span className="text-on-surface whitespace-nowrap">${(i.priceUSDT * i.qty).toLocaleString()}</span>
          </div>
        ))}
        {promo && (
          <div className="flex justify-between font-body-md text-sm text-on-surface-variant border-t border-[#2e2d2b] pt-2">
            <span>Промокод {promo.code}</span><span>−{promo.pct}%</span>
          </div>
        )}
        <div className="flex justify-between border-t border-[#2e2d2b] pt-3">
          <span className="font-label-caps text-label-caps uppercase tracking-widest text-[11px] text-on-surface-variant">Разом</span>
          <span className="font-headline-md text-headline-md text-primary">${total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create `src/app/checkout/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CheckoutForm from '@/components/cart/CheckoutForm'

export const metadata: Metadata = { title: 'Оформлення | Trade M' }

export default async function CheckoutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/checkout')

  const { data: profile } = await supabase
    .from('profiles')
    .select('phone')
    .eq('id', user.id)
    .single()

  return (
    <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-16 pb-section-gap">
      <div className="flex items-center gap-4 mb-10">
        <div className="h-px bg-outline-variant flex-1" />
        <h1 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest whitespace-nowrap">Оформлення</h1>
        <div className="h-px bg-outline-variant flex-1" />
      </div>
      <CheckoutForm defaultPhone={profile?.phone ?? ''} />
    </div>
  )
}
```

- [ ] **Step 5: Verify build**

Run: `npx tsc --noEmit && npx eslint src/middleware.ts src/components/auth/LoginForm.tsx src/components/cart/CheckoutForm.tsx src/app/checkout/page.tsx`
Expected: 0 errors. (`LoginForm` now uses `useSearchParams` — it is already rendered under a route that allows it; if a Suspense warning appears at build, wrap the login page content in `<Suspense>` — see Task 11 verification.)

- [ ] **Step 6: Commit**

```bash
git add src/middleware.ts src/components/auth/LoginForm.tsx src/components/cart/CheckoutForm.tsx src/app/checkout/page.tsx
git commit -m "feat(checkout): checkout page + form, /checkout auth gate, login redirect support"
```

---

## Task 11: End-to-end verification

**Files:** none (verification only). Fix-ups committed if needed.

- [ ] **Step 1: Full build**

Run: `npm run build`
Expected: exit 0, "Compiled successfully". If the build complains that `useSearchParams()` in `LoginForm` needs a Suspense boundary, wrap the form usage in `src/app/login/page.tsx` with `<Suspense fallback={null}>...</Suspense>` (import `Suspense` from `react`), then rebuild. Commit any fix with `fix(checkout): wrap login form in Suspense for useSearchParams`.

- [ ] **Step 2: Unit tests**

Run: `npm test`
Expected: all cart-math + cart-reducer tests pass.

- [ ] **Step 3: Manual end-to-end on `npm run dev`**

Verify the full flow:
1. Logged out: add 2 products → badge shows count → `/cart` lists them, qty/remove work.
2. Apply a valid promo created in `/admin/promos` → discounted total; `uses_count` unchanged (preview).
3. Click "Перейти до оформлення" → `/checkout` redirects to `/login?redirect=/checkout`.
4. Log in → lands back on `/checkout`, phone prefilled from profile.
5. Fill Nova Poshta + submit → redirected to `/dashboard/orders?success=<id>`; the new order appears with status "pending".
6. In Supabase: the order's `total_usdt` equals the DB-recomputed discounted total, `promo_code`/`discount_pct` are set, and the promo's `uses_count` incremented by exactly one.
7. In `/admin/orders`: the order is visible.
8. Confirm the cart is now empty (badge gone).

- [ ] **Step 4: Verify RLS isolation**

Confirm a user cannot insert an order for another `user_id` (the `with check (auth.uid() = user_id)` policy rejects it). The Server Action always sets `user_id` to the session user, so this holds by construction; no extra code needed.

- [ ] **Step 5: Final commit (if any fix-ups)**

```bash
git add -A
git commit -m "test(checkout): end-to-end verification fix-ups"
```

---

## Notes for the implementer

- **Do not trust client prices.** `placeOrder` recomputes `total_usdt` from the `products` table; the cart's stored `priceUSDT` is display-only.
- **Promo preview vs redeem:** `validate_promo` (read-only) drives the `/cart` preview; `redeem_promo` (atomic increment) runs only inside `placeOrder`. Never call `redeem_promo` for the preview.
- **Lint gate:** this repo fails the build on `react-hooks/set-state-in-effect` and `react-hooks/purity`. The cart uses `useSyncExternalStore` (no setState-in-effect); keep new client state in event handlers, not effects.
- **No new deps beyond Vitest.** Everything else uses what's already installed.
