# Customer Order-Status Emails — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Email the customer a branded Ukrainian message on every order status transition (placed, confirmed, shipped, delivered, cancelled), sent via Resend, alongside the existing Telegram director notifications.

**Architecture:** New `src/lib/notify/email.ts` mirrors `telegram.ts` — a pure `formatCustomerOrderEmail(data, event)` (unit-tested) plus a `sendCustomerOrderEmail` side-effect that POSTs to the Resend API and no-ops without `RESEND_API_KEY` or a recipient email. The customer email is snapshotted onto the order (`orders.recipient_email`) at checkout, so every send site reads it directly with no service-role lookup.

**Tech Stack:** Next.js 16 server actions + route handlers, Supabase, Resend HTTP API, vitest (env `node`).

**Spec:** `docs/superpowers/specs/2026-06-17-customer-order-emails-design.md`

---

## File Structure

**Create:**
- `supabase/migrations/0003_order_recipient_email.sql` — add nullable `recipient_email`.
- `src/lib/notify/email.ts` — formatter + Resend sender.
- `src/lib/notify/email.test.ts` — unit tests for the formatter.

**Modify:**
- `src/lib/types/database.types.ts` — add `recipient_email` to orders Row/Insert/Update.
- `src/lib/cart/actions.ts` — snapshot email at insert + send `placed`.
- `src/lib/orders/actions.ts` — expand select + send `cancelled`.
- `src/app/api/admin/orders/[id]/route.ts` — idempotent status update + send per-status email.

**Test convention:** repo unit-tests pure logic only (vitest, env `node`). Task 2 is TDD; wiring tasks (3–5) are verified by `npx tsc --noEmit` + build + manual send.

---

## Task 1: Migration — `orders.recipient_email`

**Files:**
- Create: `supabase/migrations/0003_order_recipient_email.sql`
- Modify: `src/lib/types/database.types.ts`

- [ ] **Step 1: Write the migration**

`supabase/migrations/0003_order_recipient_email.sql`:

```sql
-- Snapshot the customer's email onto the order at checkout, mirroring the
-- existing recipient_* snapshot columns. Nullable: legacy orders stay NULL and
-- simply don't get notification emails. Read by the order-email notifiers.
alter table public.orders add column if not exists recipient_email text;
```

- [ ] **Step 2: Apply the migration**

Apply to the Supabase project (via the Supabase MCP `apply_migration`, name `order_recipient_email`, or `supabase db push`).
Expected: column `recipient_email` exists on `public.orders`.

- [ ] **Step 3: Update generated types**

In `src/lib/types/database.types.ts`, inside the `orders` table, add the field to all three shapes. In `Row` (after `nova_poshta_address`-area recipient fields):

```ts
          recipient_email: string | null
```

In `Insert`:

```ts
          recipient_email?: string | null
```

In `Update`:

```ts
          recipient_email?: string | null
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0003_order_recipient_email.sql src/lib/types/database.types.ts
git commit -m "feat(orders): add recipient_email snapshot column"
```

---

## Task 2: Email module (formatter + sender) — TDD

**Files:**
- Create: `src/lib/notify/email.ts`
- Test: `src/lib/notify/email.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/notify/email.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { formatCustomerOrderEmail, type OrderEmailData } from './email'

const base: OrderEmailData = {
  id: 'abcdef12-3456-7890-abcd-ef1234567890',
  email: 'customer@example.com',
  items: [{ product_id: 'p1', name: 'Antminer S21', price_usdt: 5000, qty: 2 }],
  total: 10000,
  firstName: 'Денис',
  lastName: 'Коваленко',
  city: 'Дніпро',
  branch: 'Відділення №5',
  promoCode: null,
  discountPct: null,
}

describe('formatCustomerOrderEmail', () => {
  it('builds a placed subject with the short id and brand', () => {
    const { subject } = formatCustomerOrderEmail(base, 'placed')
    expect(subject).toContain('abcdef12')
    expect(subject).toContain('прийнято')
    expect(subject).toContain('TradeM')
  })

  it('uses the right word per event', () => {
    expect(formatCustomerOrderEmail(base, 'confirmed').subject).toContain('підтверджено')
    expect(formatCustomerOrderEmail(base, 'shipped').subject).toContain('відправлено')
    expect(formatCustomerOrderEmail(base, 'delivered').subject).toContain('доставлено')
    expect(formatCustomerOrderEmail(base, 'cancelled').subject).toContain('скасовано')
  })

  it('includes items, total and the dashboard link in the html', () => {
    const { html } = formatCustomerOrderEmail(base, 'placed')
    expect(html).toContain('Antminer S21')
    expect(html).toContain('$10,000')
    expect(html).toContain('/dashboard/orders')
  })

  it('escapes html-special chars in item names', () => {
    const { html } = formatCustomerOrderEmail(
      { ...base, items: [{ product_id: 'p', name: '<b>x', price_usdt: 1, qty: 1 }] },
      'placed',
    )
    expect(html).toContain('&lt;b&gt;x')
    expect(html).not.toContain('<b>x')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/notify/email.test.ts`
Expected: FAIL — `Cannot find module './email'`.

- [ ] **Step 3: Implement the module**

`src/lib/notify/email.ts`:

```ts
import type { OrderItem } from '@/lib/types/database.types'

const SITE_URL = 'https://традем.com.ua'
const FROM = 'TradeM <no-reply@xn--80aid2aql.com.ua>'
const RESEND_ENDPOINT = 'https://api.resend.com/emails'

export type OrderEmailEvent = 'placed' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

export interface OrderEmailData {
  id: string
  email: string | null
  items: OrderItem[]
  total: number
  firstName: string
  lastName: string
  city: string
  branch: string
  promoCode?: string | null
  discountPct?: number | null
}

// Escape the three characters that matter for HTML so user-provided fields
// (item name, recipient, branch) can't break the markup.
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const SUBJECT_WORD: Record<OrderEmailEvent, string> = {
  placed: 'прийнято',
  confirmed: 'підтверджено',
  shipped: 'відправлено',
  delivered: 'доставлено',
  cancelled: 'скасовано',
}

const EVENT_COPY: Record<OrderEmailEvent, { tag: string; heading: string; intro: string }> = {
  placed: { tag: 'Замовлення', heading: 'Замовлення прийнято', intro: 'Дякуємо за замовлення! Ми отримали його та скоро звʼяжемося для підтвердження.' },
  confirmed: { tag: 'Статус', heading: 'Замовлення підтверджено', intro: 'Ваше замовлення підтверджено й готується до відправлення.' },
  shipped: { tag: 'Доставка', heading: 'Замовлення відправлено', intro: 'Ваше замовлення передано в доставку Новою Поштою.' },
  delivered: { tag: 'Доставка', heading: 'Замовлення доставлено', intro: 'Ваше замовлення доставлено. Дякуємо, що обрали TradeM!' },
  cancelled: { tag: 'Статус', heading: 'Замовлення скасовано', intro: 'Ваше замовлення скасовано. Якщо це сталося помилково — напишіть нам, і ми допоможемо.' },
}

// Pure: builds the UA subject + branded dark/gold HTML. No network, no env.
export function formatCustomerOrderEmail(o: OrderEmailData, event: OrderEmailEvent): { subject: string; html: string } {
  const shortId = o.id.slice(0, 8)
  const copy = EVENT_COPY[event]
  const subject = `Замовлення #${shortId} ${SUBJECT_WORD[event]} — TradeM`

  const itemsRows = o.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0;font-family:Arial,sans-serif;font-size:14px;color:#d1c5af;">${esc(i.name)} ×${i.qty}</td>` +
        `<td align="right" style="padding:6px 0;font-family:Arial,sans-serif;font-size:14px;color:#e5e2db;white-space:nowrap;">$${(i.price_usdt * i.qty).toLocaleString('en-US')}</td></tr>`,
    )
    .join('')

  const promoRow = o.promoCode
    ? `<tr><td colspan="2" style="padding:6px 0;font-family:Arial,sans-serif;font-size:13px;color:#9a8f78;">Промокод ${esc(o.promoCode)} (−${o.discountPct ?? 0}%)</td></tr>`
    : ''

  const html = `<!DOCTYPE html><html lang="uk"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="color-scheme" content="dark"/></head>
<body style="margin:0;padding:0;background-color:#0e0e0a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0e0e0a;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">
        <tr><td style="height:3px;line-height:3px;font-size:3px;background-color:#ecc246;border-radius:8px 8px 0 0;">&nbsp;</td></tr>
        <tr><td style="background-color:#1a1918;border:1px solid #2e2d2b;border-top:0;border-radius:0 0 8px 8px;padding:40px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td align="center" style="padding-bottom:8px;"><img src="${SITE_URL}/logo.png" width="48" height="48" alt="TradeM" style="display:block;border-radius:50%;border:0;"/></td></tr>
            <tr><td align="center"><span style="font-family:Arial,sans-serif;font-size:24px;font-weight:800;color:#e5e2db;">Trade<span style="color:#ecc246;">M</span></span></td></tr>
          </table>
          <p style="margin:24px 0 0;font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#ecc246;">${copy.tag} · #${shortId}</p>
          <h1 style="margin:8px 0 0;font-family:Arial,sans-serif;font-size:24px;font-weight:800;text-transform:uppercase;color:#e5e2db;">${copy.heading}</h1>
          <p style="margin:14px 0 0;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#d1c5af;">${copy.intro}</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;border-top:1px solid #2e2d2b;padding-top:8px;">
            ${itemsRows}
            ${promoRow}
            <tr><td style="padding:12px 0 0;border-top:1px solid #2e2d2b;font-family:Arial,sans-serif;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9a8f78;">Разом</td>
                <td align="right" style="padding:12px 0 0;border-top:1px solid #2e2d2b;font-family:Arial,sans-serif;font-size:18px;font-weight:700;color:#ecc246;">$${o.total.toLocaleString('en-US')}</td></tr>
          </table>
          <p style="margin:20px 0 0;font-family:Arial,sans-serif;font-size:13px;color:#9a8f78;">Доставка: ${esc(o.city)}, ${esc(o.branch)}</p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:28px auto 0;"><tr>
            <td align="center" bgcolor="#c9a227" style="border-radius:4px;">
              <a href="${SITE_URL}/dashboard/orders" target="_blank" style="display:inline-block;padding:14px 36px;font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#0e0e0a;text-decoration:none;">Мої замовлення</a>
            </td>
          </tr></table>
        </td></tr>
        <tr><td align="center" style="padding:24px 40px;">
          <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#6f6a5f;"><a href="https://t.me/BOSSDnepra" style="color:#ecc246;text-decoration:none;">@BOSSDnepra</a> · 097-422-50-60</p>
          <p style="margin:8px 0 0;font-family:Arial,sans-serif;font-size:11px;color:#56524a;">© 2026 TradeM · <a href="${SITE_URL}" style="color:#56524a;text-decoration:none;">традем.com.ua</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

  return { subject, html }
}

// Side effect: POST to Resend. No-ops when RESEND_API_KEY is missing (local dev)
// or the order has no email (legacy order). Throws only on transport failure —
// callers wrap so it never breaks the order action.
export async function sendCustomerOrderEmail(o: OrderEmailData, event: OrderEmailEvent): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || !o.email) return

  const { subject, html } = formatCustomerOrderEmail(o, event)
  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [o.email], subject, html }),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Resend send failed: ${res.status} ${detail}`)
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/notify/email.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/notify/email.ts src/lib/notify/email.test.ts
git commit -m "feat(notify): customer order email formatter + Resend sender"
```

---

## Task 3: Send on order placed (`placeOrder`)

**Files:**
- Modify: `src/lib/cart/actions.ts`

- [ ] **Step 1: Import the sender**

Add to the imports at the top of `src/lib/cart/actions.ts`:

```ts
import { sendCustomerOrderEmail } from '@/lib/notify/email'
```

- [ ] **Step 2: Snapshot the email on insert**

In the `.insert({ ... })` object, add the email field (right after `user_id: user.id,`):

```ts
      recipient_email: user.email ?? null,
```

- [ ] **Step 3: Send the customer email after the director notify**

After the existing `try { await notifyDirectorNewOrder(...) } catch (...) {}` block, before `return { orderId: order.id }`, add:

```ts
  try {
    await sendCustomerOrderEmail(
      {
        id: order.id,
        email: user.email ?? null,
        items: orderItems,
        total,
        firstName,
        lastName,
        city,
        branch,
        promoCode,
        discountPct: discountPct || null,
      },
      'placed',
    )
  } catch (e) {
    console.error('customer order email failed', e)
  }
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/cart/actions.ts
git commit -m "feat(checkout): email the customer when an order is placed"
```

---

## Task 4: Send on customer cancellation (`cancelOrder`)

**Files:**
- Modify: `src/lib/orders/actions.ts`

- [ ] **Step 1: Import the sender**

Add to the imports at the top of `src/lib/orders/actions.ts`:

```ts
import { sendCustomerOrderEmail } from '@/lib/notify/email'
```

- [ ] **Step 2: Expand the order SELECT**

Replace the select string so it also fetches email, city and branch:

```ts
  const { data: order } = await supabase
    .from('orders')
    .select('id, items, total_usdt, recipient_first_name, recipient_last_name, recipient_phone, recipient_email, city, nova_poshta_branch')
    .eq('id', orderId)
    .single()
```

- [ ] **Step 3: Send the cancellation email**

Inside the existing `if (order) { ... }` block, after the director Telegram `try/catch`, add a second `try/catch`:

```ts
    try {
      await sendCustomerOrderEmail(
        {
          id: order.id,
          email: order.recipient_email ?? null,
          items: (Array.isArray(order.items) ? order.items : []) as OrderItem[],
          total: Number(order.total_usdt),
          firstName: order.recipient_first_name ?? '',
          lastName: order.recipient_last_name ?? '',
          city: order.city ?? '',
          branch: order.nova_poshta_branch ?? '',
        },
        'cancelled',
      )
    } catch (e) {
      console.error('customer cancel email failed', e)
    }
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/orders/actions.ts
git commit -m "feat(orders): email the customer on self-cancellation"
```

---

## Task 5: Send on admin status change (idempotent PATCH)

**Files:**
- Modify: `src/app/api/admin/orders/[id]/route.ts`

- [ ] **Step 1: Rewrite the PATCH handler**

Replace the body of the `PATCH` function (after the `VALID_STATUSES` check) so it reads the order first, updates only on a real change, and emails for non-pending statuses. Full file:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { requireStaff } from '@/lib/supabase/admin'
import { sendCustomerOrderEmail } from '@/lib/notify/email'
import type { OrderItem, OrderStatus } from '@/lib/types/database.types'

const VALID_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await requireStaff()
  if (!supabase) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await request.json()
  const status: OrderStatus = body.status

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const { data: order, error: readErr } = await supabase.from('orders').select('*').eq('id', id).single()
  if (readErr || !order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // No-op (and no email) when the status is unchanged — avoids duplicate emails
  // on a repeated save of the same status.
  if (order.status === status) return NextResponse.json({ ok: true })

  const { error } = await supabase.from('orders').update({ status }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Email the customer for every status except a (rare) return to pending.
  if (status !== 'pending') {
    try {
      await sendCustomerOrderEmail(
        {
          id: order.id,
          email: order.recipient_email ?? null,
          items: (Array.isArray(order.items) ? order.items : []) as OrderItem[],
          total: Number(order.total_usdt),
          firstName: order.recipient_first_name ?? '',
          lastName: order.recipient_last_name ?? '',
          city: order.city ?? '',
          branch: order.nova_poshta_branch ?? '',
          promoCode: order.promo_code,
          discountPct: order.discount_pct,
        },
        status,
      )
    } catch (e) {
      console.error('customer status email failed', e)
    }
  }

  return NextResponse.json({ ok: true })
}
```

> Note: after the `status !== 'pending'` guard, TypeScript narrows `status` to `'confirmed' | 'shipped' | 'delivered' | 'cancelled'`, which is assignable to `OrderEmailEvent`.

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit && npx eslint "src/app/[locale]/../../app/api/admin/orders/[id]/route.ts"`
(Or simply `npx tsc --noEmit` then `npm run lint` and confirm no new errors in this file.)
Expected: no errors for this file.

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/admin/orders/[id]/route.ts"
git commit -m "feat(admin): email the customer on order status change (idempotent)"
```

---

## Task 6: Env + final verification

**Files:** none (config + verification)

- [ ] **Step 1: Add the env var**

Add `RESEND_API_KEY=<your re_… key>` to `.env.local` (gitignored) and to Vercel → Project → Settings → Environment Variables (Production + Preview). Same key created in Resend.

- [ ] **Step 2: Full test suite**

Run: `npm test`
Expected: all green (existing + new `email.test.ts`).

- [ ] **Step 3: Typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors, build succeeds.

- [ ] **Step 4: Manual smoke (prod/preview, after env set)**

- Place a test order → customer inbox gets «Замовлення … прийнято» from TradeM; director still gets Telegram.
- In `/admin/orders` move it confirmed → shipped → delivered: a matching email per step.
- Cancel an order (customer dashboard or admin): «… скасовано» email.
- Re-save the same status in admin: no duplicate email.

---

## Self-Review (done at plan-writing time)

- **Spec coverage:** migration+types → Task 1; module+formatter+sender+tests → Task 2; placed → Task 3; cancelled → Task 4; admin status + idempotency → Task 5; env + verification → Task 6. ✔
- **Placeholders:** none — full code in every step. ✔
- **Type consistency:** `OrderEmailData` / `OrderEmailEvent` / `formatCustomerOrderEmail` / `sendCustomerOrderEmail` and `OrderItem` shape (`product_id,name,price_usdt,qty`) match across Tasks 2–5; `status !== 'pending'` narrowing → `OrderEmailEvent`. ✔
