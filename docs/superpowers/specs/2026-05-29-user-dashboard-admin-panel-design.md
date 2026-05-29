# Design: User Dashboard + Admin Panel + Supabase + Google Sheets Sync

**Date:** 2026-05-29  
**Project:** TradeMua — ASIC mining e-commerce  
**Stack:** Next.js 16 (App Router) + Supabase + Tailwind 4 + Vercel

---

## Overview

Add user authentication, a personal account dashboard, and an admin panel to TradeMua. Use Supabase as the database and auth provider. Sync product catalog from Google Sheets into Supabase via a webhook triggered by Google Apps Script — the site then reads products from Supabase instead of the Google Sheets CSV directly.

---

## Architecture

```
[Google Sheets]
     ↓ onEdit (Apps Script)
     ↓ POST /api/sync-products  (Authorization: Bearer SYNC_SECRET)
[Next.js API Route]
     ↓ fetch CSV → parse (existing sheets.ts parser)
     ↓ upsert into Supabase products table
[Supabase PostgreSQL]
     ↓ read
[Next.js pages — products, home, admin]

[User browser]
     → /login → Supabase Auth (email + password)
     → /dashboard — personal account (SSR, cookie session)
     → /admin — admin panel (role=admin guard via middleware)
```

**New dependencies:**
- `@supabase/supabase-js`
- `@supabase/ssr` (cookie-based sessions for App Router + middleware)

---

## Database Schema (Supabase)

### `profiles`
Extends `auth.users` (one row per registered user, created via DB trigger on auth.users insert).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | FK → auth.users.id |
| `full_name` | text | |
| `phone` | text | Ukraine format, e.g. +380… |
| `avatar_url` | text | Public URL from Supabase Storage |
| `role` | text | `'customer'` (default) or `'admin'` |
| `created_at` | timestamptz | |

### `orders`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `user_id` | uuid | FK → profiles.id |
| `items` | jsonb | Array of `{product_id, name, price_usdt, qty}` |
| `total_usdt` | numeric | |
| `status` | text | `pending` / `confirmed` / `shipped` / `delivered` / `cancelled` |
| `promo_code` | text | nullable |
| `discount_pct` | numeric | nullable, e.g. 10 = 10% |
| `nova_poshta_address` | text | Delivery address (Nova Poshta branch or door) |
| `notes` | text | nullable |
| `created_at` | timestamptz | |

### `promo_codes`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `code` | text (UNIQUE) | Case-insensitive, e.g. "SUMMER10" |
| `discount_pct` | numeric | e.g. 5 = 5% |
| `max_uses` | int | null = unlimited |
| `uses_count` | int | Default 0, incremented on use |
| `expires_at` | timestamptz | nullable |
| `is_active` | boolean | Default true |
| `created_at` | timestamptz | |

### `products`
Cache of Google Sheets data. Replaces the current direct CSV fetch.

| Column | Type | Notes |
|---|---|---|
| `id` | text (PK) | SKU/slug from Sheets |
| `algorithm` | text | |
| `brand` | text | |
| `name` | text | "{brand} {model}" |
| `hashrate` | text | |
| `power_w` | int | |
| `price_usdt` | numeric | |
| `in_stock` | boolean | |
| `is_new` | boolean | |
| `synced_at` | timestamptz | Updated on every sync |

**Row Level Security:** `products` is readable by everyone (public). `profiles` is readable/writable by the owning user and by admin. `orders` and `promo_codes` are readable/writable by admin; orders are readable by the owning user.

---

## Authentication

**Provider:** Supabase Auth — email + password.

**Flows:**
1. **Register** (`/register`): fields — full name, phone, email, password. On success → Supabase sends confirmation email. User must confirm before logging in.
2. **Login** (`/login`): email + password. On success → cookie session via `@supabase/ssr` → redirect to `/dashboard`.
3. **Password recovery** (`/login` → "Забули пароль?"): Supabase sends reset link to email. `/auth/reset-password` page handles the new password form.
4. **Logout**: clears cookie session → redirect to `/`.

**Session management:** `@supabase/ssr` with cookie storage. Next.js middleware refreshes the session token on every request.

---

## Route Protection (middleware.ts)

```
/dashboard/*  → requires valid session → else redirect /login
/admin/*      → requires valid session → else redirect /login
              → role check (profiles.role = 'admin') done in /admin/layout.tsx (Server Component)
              → if not admin → redirect /
/api/sync-products  → requires Authorization: Bearer SYNC_SECRET header
```

**Why role check in layout, not middleware:** Supabase JWT doesn't include custom `role` by default. Reading the role from the `profiles` table in a Server Component avoids setting up custom JWT claims (complex). The middleware only verifies session existence; the `/admin/layout.tsx` Server Component reads `profiles.role` and redirects non-admins.

---

## New Routes

| Route | Access | Description |
|---|---|---|
| `/login` | public | Email + password form, link to register, link to forgot password |
| `/register` | public | Registration form: name, phone, email, password |
| `/auth/confirm` | public | Email confirmation landing page |
| `/auth/reset-password` | public | New password form (after email link) |
| `/dashboard` | authenticated | Personal account — profile + orders tabs |
| `/admin` | admin only | Admin panel — users, orders, promos, products sync |
| `/api/sync-products` | server (secret) | POST — triggers Google Sheets → Supabase sync |

---

## User Dashboard (`/dashboard`)

Two tabs: **Профіль** and **Мої замовлення**.

### Profile tab
- Edit: full name, phone
- Change email (triggers Supabase re-confirmation email)
- Upload avatar (→ Supabase Storage bucket `avatars`, public)

### Orders tab
Table/list of user's orders:
- Date, product list, total $, status badge, Nova Poshta address
- Promo code and discount if applied
- Read-only for the user (status changes by admin only)

---

## Admin Panel (`/admin`)

Four sections accessible via sidebar navigation.

### Users
- Paginated table: name, email, phone, registered date, order count
- Click row → user detail: full profile + their order history
- No delete (soft-disable if needed in future)

### Orders
- All orders across all users, filterable by status
- Change order status via dropdown (pending → confirmed → shipped → delivered / cancelled)
- Create order manually: select user, add products (search by name), set Nova Poshta address, optionally apply promo code

### Promo Codes
- Create: code (auto-generate or manual input), discount %, max uses (blank = unlimited), expiry date (optional)
- List: code, discount %, uses_count / max_uses, expires_at, active toggle
- Deactivate / delete

### Products (Sync Status)
- Last sync timestamp
- Total product count in Supabase
- "Синхронізувати зараз" button → calls `/api/sync-products` from the admin UI
- Shows success/error from last sync

---

## Google Sheets → Supabase Sync

### Flow
1. Admin edits Google Sheets (price, stock status, new row, etc.)
2. Apps Script `onEdit` trigger fires
3. Apps Script sends `POST https://trademua.vercel.app/api/sync-products` with `Authorization: Bearer SYNC_SECRET`
4. API route re-fetches the full CSV from `SHEETS_CSV_URL`
5. Parses with existing `sheets.ts` parser (unchanged)
6. `UPSERT` all parsed products into `products` table (by `id`)
7. Deletes products from Supabase that are no longer in the sheet
8. Updates `synced_at` timestamp on all upserted rows

### Fallback
Vercel Cron job runs `/api/sync-products` every hour as backup if the webhook misses (e.g. Apps Script quota exceeded).

### Google Apps Script (to be set up manually once)
```javascript
function onEdit(e) {
  const secret = PropertiesService.getScriptProperties().getProperty('SYNC_SECRET');
  UrlFetchApp.fetch('https://trademua.vercel.app/api/sync-products', {
    method: 'post',
    headers: { 'Authorization': 'Bearer ' + secret },
    muteHttpExceptions: true,
  });
}
```

### Environment Variables (Vercel)
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   (server-only, for sync API)
SYNC_SECRET=...                  (random string, matches Apps Script)
```

---

## Navbar Changes

When a user is **logged out**: shows "Логін" button (current behavior).  
When a user is **logged in**: shows avatar (or initials placeholder) + "Кабінет" link → `/dashboard`. If admin role, also shows "Адмін" link.

---

## Design System

Both dashboard and admin panel follow the existing dark "Industrial Excellence" theme:
- `.bg-card` containers, `.border-card` borders
- Primary gold `#ecc246` for active states, badges, CTAs
- `btn-primary` for save actions, `btn-ghost` for secondary
- Status badges use `chip` class with color variants (green for active/delivered, yellow for pending, etc.)
- Syne + Hanken Grotesk fonts, UPPERCASE labels with `tracking-widest`

---

## Out of Scope (this phase)

- Cart / checkout flow (order creation is admin-only for now)
- Telegram notifications for new orders
- Google OAuth login
- Tiered loyalty discounts (promo codes only)
- Payment integration
