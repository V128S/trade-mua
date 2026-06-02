# Информативные поля оформления заказа — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Заменить единое поле «Нова Пошта» в оформлении заказа на раздельные информативные поля (имя, фамилия, телефон, город, отделение Новой Почты) с хранением в отдельных колонках `orders` и понятным отображением в админке.

**Architecture:** Добавляем 5 nullable-колонок в `orders` (вариант A из спеки). Чистые хелперы (`splitFullName`, `composeShippingAddress`) покрываются юнит-тестами (vitest). Серверный экшен `placeOrder` пишет в новые колонки; форма `CheckoutForm` собирает раздельные поля с префиллом из профиля; админская `OrdersTable` показывает раздельные данные получателя с фоллбэком на старые заказы.

**Tech Stack:** Next.js 16 (App Router) + React 19, TypeScript, Supabase, next-intl, vitest.

**Spec:** `docs/superpowers/specs/2026-06-02-checkout-fields-design.md`

**Команды проверки:**
- Тесты: `npm test` (vitest run)
- Типы: `npx tsc --noEmit`
- Сборка: `npm run build`
- Линт: `npm run lint`

---

## Файловая карта

- **Migration (Supabase):** добавить колонки в `orders` — применяется через MCP `apply_migration`.
- **Create** `src/lib/cart/shipping.ts` — чистые хелперы `splitFullName`, `composeShippingAddress`.
- **Create** `src/lib/cart/shipping.test.ts` — юнит-тесты хелперов.
- **Modify** `src/lib/types/database.types.ts` — новые колонки в `orders` Row/Insert.
- **Modify** `src/lib/cart/actions.ts` — расширить `PlaceOrderInput` и вставку заказа.
- **Modify** `src/app/[locale]/checkout/page.tsx` — передать `defaultFullName`.
- **Modify** `src/components/cart/CheckoutForm.tsx` — раздельные поля.
- **Modify** `src/messages/ru.json`, `src/messages/uk.json` — ключи namespace `checkout`.
- **Modify** `src/components/admin/OrdersTable.tsx` — отображение получателя + поиск.

---

## Task 1: Миграция БД — колонки получателя

**Files:**
- Migration (Supabase MCP), без файла в репо

- [ ] **Step 1: Применить миграцию**

Вызвать MCP-инструмент `mcp__supabase__apply_migration` с `name: "orders_recipient_fields"` и query:

```sql
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS recipient_first_name text,
  ADD COLUMN IF NOT EXISTS recipient_last_name  text,
  ADD COLUMN IF NOT EXISTS recipient_phone      text,
  ADD COLUMN IF NOT EXISTS city                 text,
  ADD COLUMN IF NOT EXISTS nova_poshta_branch   text;
```

- [ ] **Step 2: Проверить, что колонки появились**

Вызвать `mcp__supabase__execute_sql`:

```sql
SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='orders'
  AND column_name IN ('recipient_first_name','recipient_last_name','recipient_phone','city','nova_poshta_branch')
ORDER BY column_name;
```

Expected: 5 строк (`city`, `nova_poshta_branch`, `recipient_first_name`, `recipient_last_name`, `recipient_phone`).

> Примечание: миграция применяется прямо к боевому проекту Supabase (как принято в этом репозитории). Файла-миграции в репо нет — коммитить на этом шаге нечего.

---

## Task 2: Чистые хелперы доставки (TDD)

**Files:**
- Create: `src/lib/cart/shipping.ts`
- Test: `src/lib/cart/shipping.test.ts`

- [ ] **Step 1: Написать падающий тест**

Создать `src/lib/cart/shipping.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { splitFullName, composeShippingAddress } from './shipping'

describe('splitFullName', () => {
  it('splits on the first whitespace', () => {
    expect(splitFullName('Денис Іваненко')).toEqual({ first: 'Денис', last: 'Іваненко' })
  })
  it('keeps multi-word last name in last', () => {
    expect(splitFullName('Денис Іван Петрович')).toEqual({ first: 'Денис', last: 'Іван Петрович' })
  })
  it('single word goes to first, last empty', () => {
    expect(splitFullName('Денис')).toEqual({ first: 'Денис', last: '' })
  })
  it('empty / whitespace-only yields empties', () => {
    expect(splitFullName('   ')).toEqual({ first: '', last: '' })
    expect(splitFullName('')).toEqual({ first: '', last: '' })
  })
})

describe('composeShippingAddress', () => {
  it('joins city and branch with a comma', () => {
    expect(composeShippingAddress('Дніпро', 'Відділення №5')).toBe('Дніпро, Відділення №5')
  })
  it('omits empty parts', () => {
    expect(composeShippingAddress('Дніпро', '')).toBe('Дніпро')
    expect(composeShippingAddress('', '')).toBe('')
  })
  it('trims parts', () => {
    expect(composeShippingAddress('  Київ ', ' №1 ')).toBe('Київ, №1')
  })
})
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npm test -- shipping`
Expected: FAIL — `Failed to resolve import "./shipping"` / функции не определены.

- [ ] **Step 3: Реализовать хелперы**

Создать `src/lib/cart/shipping.ts`:

```ts
// Best-effort split of a stored full name into first/last for prefilling the
// checkout form. Splits on the first whitespace: text before it is the first
// name, the trimmed remainder is the last name.
export function splitFullName(fullName: string): { first: string; last: string } {
  const trimmed = fullName.trim()
  if (!trimmed) return { first: '', last: '' }
  const idx = trimmed.search(/\s/)
  if (idx === -1) return { first: trimmed, last: '' }
  return { first: trimmed.slice(0, idx), last: trimmed.slice(idx + 1).trim() }
}

// Compose the legacy single-line Nova Poshta address from the structured city +
// branch fields, so old admin views and existing orders stay consistent.
export function composeShippingAddress(city: string, branch: string): string {
  return [city.trim(), branch.trim()].filter(Boolean).join(', ')
}
```

- [ ] **Step 4: Запустить тест — убедиться, что проходит**

Run: `npm test -- shipping`
Expected: PASS (все кейсы).

- [ ] **Step 5: Коммит**

```bash
git add src/lib/cart/shipping.ts src/lib/cart/shipping.test.ts
git commit -m "feat(checkout): add splitFullName + composeShippingAddress helpers"
```

---

## Task 3: Типы БД — новые колонки orders

**Files:**
- Modify: `src/lib/types/database.types.ts:48-69`

- [ ] **Step 1: Добавить колонки в Row**

В `src/lib/types/database.types.ts` в блоке `orders.Row` заменить:

```ts
          discount_pct: number | null
          nova_poshta_address: string | null
          notes: string | null
          created_at: string
```

на:

```ts
          discount_pct: number | null
          recipient_first_name: string | null
          recipient_last_name: string | null
          recipient_phone: string | null
          city: string | null
          nova_poshta_branch: string | null
          nova_poshta_address: string | null
          notes: string | null
          created_at: string
```

- [ ] **Step 2: Добавить колонки в Insert**

В блоке `orders.Insert` заменить:

```ts
          discount_pct?: number | null
          nova_poshta_address?: string | null
          notes?: string | null
```

на:

```ts
          discount_pct?: number | null
          recipient_first_name?: string | null
          recipient_last_name?: string | null
          recipient_phone?: string | null
          city?: string | null
          nova_poshta_branch?: string | null
          nova_poshta_address?: string | null
          notes?: string | null
```

- [ ] **Step 3: Проверить типы**

Run: `npx tsc --noEmit`
Expected: без ошибок (этот шаг не использует новые поля ещё нигде — только расширяет тип).

- [ ] **Step 4: Коммит**

```bash
git add src/lib/types/database.types.ts
git commit -m "feat(checkout): add recipient/city/branch columns to orders type"
```

---

## Task 4: Серверный экшен placeOrder

**Files:**
- Modify: `src/lib/cart/actions.ts`

- [ ] **Step 1: Импортировать хелпер**

В `src/lib/cart/actions.ts` строку:

```ts
import { buildOrderItems, applyDiscount } from '@/lib/cart/cart-math'
```

заменить на:

```ts
import { buildOrderItems, applyDiscount } from '@/lib/cart/cart-math'
import { composeShippingAddress } from '@/lib/cart/shipping'
```

- [ ] **Step 2: Расширить PlaceOrderInput**

Заменить интерфейс:

```ts
export interface PlaceOrderInput {
  items: { id: string; qty: number }[]
  promoCode?: string | null
  novaPoshta: string
  phone: string
  notes?: string
}
```

на:

```ts
export interface PlaceOrderInput {
  items: { id: string; qty: number }[]
  promoCode?: string | null
  firstName: string
  lastName: string
  phone: string
  city: string
  branch: string
  notes?: string
}
```

- [ ] **Step 3: Валидация обязательных полей**

Сразу после блока проверки пользователя (после `if (!user) return { error: 'Потрібен вхід' }`) добавить:

```ts
  const firstName = input.firstName.trim()
  const lastName = input.lastName.trim()
  const phone = input.phone.trim()
  const city = input.city.trim()
  const branch = input.branch.trim()
  if (!firstName || !lastName || !phone || !city || !branch) {
    return { error: 'Заповніть усі обовʼязкові поля' }
  }
```

- [ ] **Step 4: Заменить сбор notes/телефона и вставку заказа**

Заменить блок:

```ts
  // The orders table has no phone column — fold the contact phone into notes
  // so the operator sees it on the order (order-as-request flow).
  const phone = input.phone.trim()
  const notes = [phone ? `Телефон: ${phone}` : '', input.notes?.trim() ?? '']
    .filter(Boolean)
    .join('\n') || null

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
      notes,
    })
    .select('id')
    .single()
```

на:

```ts
  // Comment-only notes now — recipient/contact data lives in dedicated columns.
  const notes = input.notes?.trim() || null

  const { data: order, error: insErr } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      items: orderItems,
      total_usdt: total,
      status: 'pending',
      promo_code: promoCode,
      discount_pct: discountPct || null,
      recipient_first_name: firstName,
      recipient_last_name: lastName,
      recipient_phone: phone,
      city,
      nova_poshta_branch: branch,
      // Keep the legacy single-line address for backward-compatible display.
      nova_poshta_address: composeShippingAddress(city, branch),
      notes,
    })
    .select('id')
    .single()
```

- [ ] **Step 5: Проверить типы**

Run: `npx tsc --noEmit`
Expected: ошибки **только** в `src/components/cart/CheckoutForm.tsx` (старый вызов `placeOrder` с `novaPoshta`). Это ожидаемо — исправим в Task 6. Ошибок в `actions.ts` быть не должно.

- [ ] **Step 6: Коммит**

```bash
git add src/lib/cart/actions.ts
git commit -m "feat(checkout): store recipient/city/branch on order in placeOrder"
```

---

## Task 5: Префилл full_name на странице checkout

**Files:**
- Modify: `src/app/[locale]/checkout/page.tsx:24-28,49`

- [ ] **Step 1: Расширить выборку профиля**

Заменить:

```ts
  const { data: profile } = await supabase
    .from('profiles')
    .select('phone')
    .eq('id', user.id)
    .single()
```

на:

```ts
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone')
    .eq('id', user.id)
    .single()
```

- [ ] **Step 2: Передать defaultFullName в форму**

Заменить:

```tsx
      <CheckoutForm defaultPhone={profile?.phone ?? ''} />
```

на:

```tsx
      <CheckoutForm defaultPhone={profile?.phone ?? ''} defaultFullName={profile?.full_name ?? ''} />
```

- [ ] **Step 3: Проверить типы**

Run: `npx tsc --noEmit`
Expected: ошибка в `checkout/page.tsx` про неизвестный проп `defaultFullName` (форма ещё не принимает его) + прежняя ошибка в `CheckoutForm.tsx`. Обе уйдут после Task 6.

- [ ] **Step 4: Коммит**

```bash
git add "src/app/[locale]/checkout/page.tsx"
git commit -m "feat(checkout): pass full_name to checkout form for prefill"
```

---

## Task 6: Раздельные поля в CheckoutForm

**Files:**
- Modify: `src/components/cart/CheckoutForm.tsx`

- [ ] **Step 1: Добавить импорт хелпера**

После строки `import { placeOrder } from '@/lib/cart/actions'` добавить:

```ts
import { splitFullName } from '@/lib/cart/shipping'
```

- [ ] **Step 2: Обновить сигнатуру и состояние**

Заменить:

```tsx
export default function CheckoutForm({ defaultPhone }: { defaultPhone: string }) {
  const t = useTranslations('checkout')
  const { items, promo, subtotal, hydrated, clear } = useCart()
  const router = useRouter()
  const [novaPoshta, setNovaPoshta] = useState('')
  const [phone, setPhone] = useState(defaultPhone)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
```

на:

```tsx
export default function CheckoutForm({ defaultPhone, defaultFullName }: { defaultPhone: string; defaultFullName: string }) {
  const t = useTranslations('checkout')
  const { items, promo, subtotal, hydrated, clear } = useCart()
  const router = useRouter()
  const prefill = splitFullName(defaultFullName)
  const [firstName, setFirstName] = useState(prefill.first)
  const [lastName, setLastName] = useState(prefill.last)
  const [phone, setPhone] = useState(defaultPhone)
  const [city, setCity] = useState('')
  const [branch, setBranch] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
```

- [ ] **Step 3: Обновить вызов placeOrder**

Заменить:

```tsx
    const res = await placeOrder({
      items: items.map(i => ({ id: i.id, qty: i.qty })),
      promoCode: promo?.code ?? null,
      novaPoshta,
      phone,
      notes,
    })
```

на:

```tsx
    const res = await placeOrder({
      items: items.map(i => ({ id: i.id, qty: i.qty })),
      promoCode: promo?.code ?? null,
      firstName,
      lastName,
      phone,
      city,
      branch,
      notes,
    })
```

- [ ] **Step 4: Заменить разметку полей формы**

Заменить блок (поля Нова Пошта + телефон + комментарий):

```tsx
        <div>
          <label className={labelCls}>{t('labelNovaPoshta')}</label>
          <input value={novaPoshta} onChange={e => setNovaPoshta(e.target.value)} required placeholder={t('placeholderNovaPoshta')} className={field} />
        </div>
        <div>
          <label className={labelCls}>{t('labelPhone')}</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+380..." className={field} />
        </div>
        <div>
          <label className={labelCls}>{t('labelComment')}</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={field} />
        </div>
```

на:

```tsx
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>{t('labelFirstName')}</label>
            <input value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder={t('labelFirstName')} className={field} />
          </div>
          <div>
            <label className={labelCls}>{t('labelLastName')}</label>
            <input value={lastName} onChange={e => setLastName(e.target.value)} required placeholder={t('labelLastName')} className={field} />
          </div>
        </div>
        <div>
          <label className={labelCls}>{t('labelPhone')}</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+380..." className={field} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>{t('labelCity')}</label>
            <input value={city} onChange={e => setCity(e.target.value)} required placeholder={t('placeholderCity')} className={field} />
          </div>
          <div>
            <label className={labelCls}>{t('labelBranch')}</label>
            <input value={branch} onChange={e => setBranch(e.target.value)} required placeholder={t('placeholderBranch')} className={field} />
          </div>
        </div>
        <div>
          <label className={labelCls}>{t('labelComment')}</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={field} />
        </div>
```

- [ ] **Step 5: Проверить типы**

Run: `npx tsc --noEmit`
Expected: без ошибок (i18n-ключи проверяются в рантайме, не типами).

- [ ] **Step 6: Коммит**

```bash
git add src/components/cart/CheckoutForm.tsx
git commit -m "feat(checkout): split form into name/phone/city/NP-branch fields"
```

---

## Task 7: i18n-ключи (namespace checkout)

**Files:**
- Modify: `src/messages/ru.json`
- Modify: `src/messages/uk.json`

- [ ] **Step 1: ru.json**

В `src/messages/ru.json` в namespace `checkout` заменить две строки:

```json
    "labelNovaPoshta": "Отделение Новой Почты",
    "placeholderNovaPoshta": "Город, № отделения",
```

на:

```json
    "labelFirstName": "Имя",
    "labelLastName": "Фамилия",
    "labelCity": "Город",
    "labelBranch": "Отделение Новой Почты",
    "placeholderCity": "Город",
    "placeholderBranch": "№ отделения",
```

- [ ] **Step 2: uk.json**

В `src/messages/uk.json` в namespace `checkout` заменить две строки:

```json
    "labelNovaPoshta": "Відділення Нової Пошти",
    "placeholderNovaPoshta": "Місто, № відділення",
```

на:

```json
    "labelFirstName": "Ім'я",
    "labelLastName": "Прізвище",
    "labelCity": "Місто",
    "labelBranch": "Відділення Нової Пошти",
    "placeholderCity": "Місто",
    "placeholderBranch": "№ відділення",
```

- [ ] **Step 3: Проверить валидность JSON**

Run: `node -e "require('./src/messages/ru.json'); require('./src/messages/uk.json'); console.log('ok')"`
Expected: `ok` (нет ошибок парсинга — например, висячих запятых).

- [ ] **Step 4: Коммит**

```bash
git add src/messages/ru.json src/messages/uk.json
git commit -m "i18n(checkout): keys for first/last name, city, NP branch"
```

---

## Task 8: Отображение получателя в админке OrdersTable

**Files:**
- Modify: `src/components/admin/OrdersTable.tsx`

- [ ] **Step 1: Хелпер имени получателя в начале компонента**

В `src/components/admin/OrdersTable.tsx`, внутри `map(order => {` сразу после строки
`const items: OrderItem[] = Array.isArray(order.items) ? order.items : []` добавить:

```tsx
            const recipientName =
              [order.recipient_first_name, order.recipient_last_name].filter(Boolean).join(' ').trim() ||
              order.profile?.full_name ||
              'Анонім'
            const recipientPhone = order.recipient_phone ?? order.profile?.phone ?? null
```

- [ ] **Step 2: Использовать recipientName/recipientPhone в шапке карточки**

Заменить:

```tsx
                    <Link
                      href={`/admin/users/${order.user_id}`}
                      className="font-body-md text-body-md text-on-surface mt-0.5 hover:text-primary transition-colors inline-block"
                    >
                      {order.profile?.full_name ?? 'Анонім'}
                    </Link>
                    {order.profile?.phone && (
                      <a
                        href={`tel:${order.profile.phone}`}
                        className="block font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors text-[11px] mt-0.5"
                      >
                        {order.profile.phone}
                      </a>
                    )}
```

на:

```tsx
                    <Link
                      href={`/admin/users/${order.user_id}`}
                      className="font-body-md text-body-md text-on-surface mt-0.5 hover:text-primary transition-colors inline-block"
                    >
                      {recipientName}
                    </Link>
                    {recipientPhone && (
                      <a
                        href={`tel:${recipientPhone}`}
                        className="block font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors text-[11px] mt-0.5"
                      >
                        {recipientPhone}
                      </a>
                    )}
```

- [ ] **Step 3: Раздельный блок адреса (город + отделение) с фоллбэком**

Заменить блок «Нова Пошта» в футере карточки:

```tsx
                  <div>
                    <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">Нова Пошта</p>
                    <p className="font-body-md text-body-md text-on-surface mt-0.5 text-sm">{order.nova_poshta_address ?? '—'}</p>
                  </div>
```

на:

```tsx
                  <div>
                    {order.city || order.nova_poshta_branch ? (
                      <>
                        <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">Місто</p>
                        <p className="font-body-md text-body-md text-on-surface mt-0.5 text-sm">{order.city ?? '—'}</p>
                        <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px] mt-2">Відділення НП</p>
                        <p className="font-body-md text-body-md text-on-surface mt-0.5 text-sm">{order.nova_poshta_branch ?? '—'}</p>
                      </>
                    ) : (
                      <>
                        <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">Нова Пошта</p>
                        <p className="font-body-md text-body-md text-on-surface mt-0.5 text-sm">{order.nova_poshta_address ?? '—'}</p>
                      </>
                    )}
                  </div>
```

- [ ] **Step 4: Поиск по имени получателя**

Заменить в `visible` мемо:

```tsx
      const name = o.profile?.full_name?.toLowerCase() ?? ''
      return o.id.toLowerCase().includes(q) || name.includes(q)
```

на:

```tsx
      const name = [o.recipient_first_name, o.recipient_last_name, o.profile?.full_name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return o.id.toLowerCase().includes(q) || name.includes(q)
```

- [ ] **Step 5: Проверить типы**

Run: `npx tsc --noEmit`
Expected: без ошибок (новые поля уже есть в типе `orders.Row` из Task 3).

- [ ] **Step 6: Коммит**

```bash
git add src/components/admin/OrdersTable.tsx
git commit -m "feat(admin): show recipient name/phone/city/NP-branch on orders"
```

---

## Task 9: Финальная проверка

**Files:** —

- [ ] **Step 1: Тесты**

Run: `npm test`
Expected: PASS (включая `shipping.test.ts`, `cart-math.test.ts`, `cart-reducer.test.ts`).

- [ ] **Step 2: Типы**

Run: `npx tsc --noEmit`
Expected: без ошибок.

- [ ] **Step 3: Линт**

Run: `npm run lint`
Expected: без ошибок (предупреждения допустимы, если они уже были в проекте).

- [ ] **Step 4: Сборка**

Run: `npm run build`
Expected: успешная сборка без ошибок типов/рантайма.

- [ ] **Step 5: Ручная проверка (опционально, через `npm run dev`)**

- `/checkout` (после логина, с товаром в корзине): видны поля Имя, Фамилия, Телефон, Город, № отделения, Комментарий; имя/фамилия префиллятся из профиля; телефон префиллится.
- Отправка с пустым обязательным полем блокируется (HTML `required`).
- После успешного заказа — редирект на `/dashboard/orders?success=...`.
- В `/admin/orders` у нового заказа видны раздельные Имя/Телефон/Місто/Відділення; у старого заказа — фоллбэк на `nova_poshta_address`.

---

## Self-review

- **Покрытие спеки:** миграция (T1), хелперы (T2), типы (T3), экшен (T4), префилл (T5), форма (T6), i18n (T7), админка (T8), верификация (T9) — все разделы спеки покрыты.
- **Плейсхолдеры:** нет — везде конкретный код/команды.
- **Согласованность типов:** `PlaceOrderInput` (firstName/lastName/phone/city/branch) ↔ вызов в `CheckoutForm` (Task 6) ↔ колонки `orders` Row/Insert (Task 3) ↔ вставка в `placeOrder` (Task 4) — имена совпадают. `splitFullName`/`composeShippingAddress` определены в T2 и используются в T4/T6.
