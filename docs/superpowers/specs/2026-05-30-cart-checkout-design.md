# Cart & Checkout — Design Spec

**Date:** 2026-05-30
**Status:** Approved design, pending implementation plan
**Topic:** Working cart and checkout for Trade M

## Goal

Replace the static `/cart` stub with a working cart and a checkout flow that creates a real
order in Supabase. No online payment — checkout produces an **order-as-request** (`status: 'pending'`)
that managers follow up on for payment and delivery. The consuming side already exists
(dashboard `OrderList`, admin `OrdersTable`); this spec builds the producing side.

## Decisions (locked)

| Decision | Choice |
|---|---|
| Checkout model | Order-as-request — inserts into `orders` with `status: 'pending'`, no payment gateway |
| Auth | Cart is open to guests; **login required at the checkout step** (order tied to `user_id`) |
| Promo codes | **Included in v1** — applied at cart, re-validated server-side, increments `uses_count` |
| Cart state | **Approach A** — React Context + `localStorage`; server re-validates prices at checkout |

## Out of scope (YAGNI)

Online payment; server-side cart table; email/Telegram notifications (new orders are visible in
the admin panel); stock decrement; guest checkout.

---

## 1. Cart state

```
src/lib/cart/
  types.ts          # CartItem { id, name, hashrate, powerW, priceUSDT, qty }
  CartContext.tsx   # CartProvider + useCart(): items, addItem, removeItem, setQty, clear,
                    #   count, subtotal. Persists to localStorage key "cart_v1".
  cart-math.ts      # pure: subtotal(items), applyDiscount(subtotal, pct) — unit-tested
```

- `CartProvider` wraps `<body>` in `src/app/layout.tsx` so the navbar badge and any page can read cart state.
- **Hydration:** server renders an empty cart; `localStorage` is read in a post-mount effect guarded by a
  `hydrated` flag to avoid SSR/client mismatch. Count badge renders only after hydration.
- `CartItem` stores a display snapshot (name, hashrate, powerW, priceUSDT) so the cart renders without
  refetching. Snapshot prices are display-only — the order total is recomputed from the DB at checkout.

## 2. Adding to cart

- **Product detail** (`src/app/products/[slug]/page.tsx`): the "Додати в кошик" button becomes a client
  `AddToCartButton` that adds the currently selected configuration (from the `ProductDetail` selector).
  Out-of-stock items show "Замовити" and still add (order-as-request allows it).
- **Catalog / home cards:** remain whole-card links to the product page (no nested interactive elements
  in v1). A quick "+" on cards can be added later.

## 3. Routes & flow

```
/cart       Client page: line items (image, name, specs, qty stepper, remove),
            summary (subtotal, promo input + applied discount, total),
            "Перейти до оформлення" → /checkout
/checkout   Auth-only (added to middleware matcher): read-only order summary +
            delivery form (Nova Poshta, phone/name prefilled from profile, notes) +
            "Підтвердити замовлення" → placeOrder Server Action
```

- Unauthenticated visit to `/checkout` → redirect `/login?redirect=/checkout`.
- Promo code is entered on `/cart`. Applying it calls a **read-only** validation (`validate_promo`,
  §5) that returns `discount_pct` for the preview **without** incrementing `uses_count`. The code is
  carried to `/checkout`; the order total only becomes final when `placeOrder` **redeems** it.

## 4. Server Action `placeOrder` (`src/lib/cart/actions.ts`)

1. `getUser()` — no session → return auth error (client redirects to login).
2. Input: `{ items: [{ id, qty }], promoCode?, novaPoshta, phone, notes }`.
3. **Recompute from DB:** fetch products by id from Supabase, build `OrderItem[]` with authoritative
   `product_id`, `name`, `price_usdt`, `qty`; compute `total_usdt`. Client prices are never trusted.
4. Promo (if provided): redeem via `redeem_promo` RPC (see §5) — re-validates and atomically
   increments `uses_count`, returning `discount_pct`. Invalid → error "недійсний промокод" and abort
   (no order created). This is the authoritative discount, not the cart preview.
5. `insert` into `orders`: `{ user_id, items, total_usdt (after discount), status: 'pending',
   promo_code, discount_pct, nova_poshta_address, notes }`.
6. Return `{ orderId }`. Client clears the cart and redirects to `/dashboard/orders?success=<id>`.

Ordering note: redeem the promo only after the items recompute succeeds and before the insert; if the
`orders` insert fails after redeeming, that is an acceptable edge (a burned use) given low volume —
documented, not engineered around in v1.

`OrderItem` shape (existing, `src/lib/types/database.types.ts`): `{ product_id, name, price_usdt, qty }`.

## 5. Supabase (RLS + RPC)

- **`orders` INSERT policy:** `with check (auth.uid() = user_id)`. Verify existing policies; add via
  migration if absent. (SELECT-own already exists for the dashboard.)
- Two `security definer` Postgres functions keep `promo_codes` access out of client-facing RLS
  (regular users have no direct SELECT/UPDATE on the table, preventing enumeration):
  - **`validate_promo(code text) returns numeric`** — read-only. Returns `discount_pct` if the code is
    `is_active`, not expired, and under `max_uses`; otherwise null. Used by the `/cart` preview.
  - **`redeem_promo(code text) returns numeric`** — re-validates the same conditions and atomically
    increments `uses_count`, returning `discount_pct` (null if invalid). Used by `placeOrder`. Atomic
    increment resolves the counter race.

## 6. Error & empty states

- Empty cart → existing empty-state design already on `/cart`.
- `/checkout` with an empty cart → redirect to `/cart`.
- Invalid promo → inline error under the field; total unchanged.
- Order insert failure → message/toast; cart is preserved.
- Product missing from DB at checkout time → skip it and recompute the total from what remains.

## 7. Testing (TDD)

Pure JS/TS logic is unit-tested first:
- `cart-math`: `subtotal`, `applyDiscount`, rounding.
- `items → OrderItem[]` mapping from a fetched product set (correct name/price, missing-product skip).

Promo validation lives in SQL (`validate_promo` / `redeem_promo`) and the Server Action + RLS are
verified manually end-to-end on dev: place an order and confirm it appears in the dashboard and admin;
apply a valid promo (discount + `uses_count` increments by exactly one on redeem, not on preview); try
an expired / over-limit / inactive code (rejected); confirm the recomputed total matches the DB prices.

## 8. Touched files (anticipated)

- New: `src/lib/cart/{types,CartContext,cart-math,actions}.ts(x)`, `src/components/cart/*`
  (cart line item, summary, checkout form, AddToCartButton), `src/app/checkout/page.tsx`,
  test files for the pure logic, one Supabase migration (`orders` INSERT RLS policy +
  `validate_promo` + `redeem_promo` functions).
- Edited: `src/app/layout.tsx` (CartProvider), `src/components/layout/Navbar.tsx` (count badge),
  `src/app/cart/page.tsx` (real cart UI), `src/app/products/[slug]/page.tsx` (AddToCartButton),
  `src/middleware.ts` (protect `/checkout`).
