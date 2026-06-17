# Спека: письма клиенту о статусе заказа

**Дата:** 2026-06-17
**Статус:** дизайн утверждён, готов к плану
**Ветка:** `feat/customer-order-emails`

## Проблема

При оформлении заказа уведомляется только директор (Telegram, `notifyDirectorNewOrder`). Клиент не получает ничего — ни подтверждения заказа, ни сообщения об отмене, ни о смене статуса (підтверджено / відправлено / доставлено). Resend как почтовый провайдер уже подключён (домен `xn--80aid2aql.com.ua` верифицирован).

## Цель

Слать клиенту брендированное письмо на **каждый переход статуса** заказа: оформление (pending), підтверджено, відправлено, доставлено, скасовано. Письма — **только на украинском**. Отправка через Resend HTTP API, рядом с существующими Telegram-уведомлениями директору (не вместо них).

## Решения (из брейнсторминга)

| Вопрос | Решение |
|---|---|
| Набор событий | **Все переходы**: placed, confirmed, shipped, delivered, cancelled |
| Язык | **Только UA** (основной язык бренда; локаль в заказе не храним) |
| Откуда email клиента | **Снапшот `recipient_email` в заказе** на чекауте (вариант A) |
| Транспорт | **Resend HTTP API** (`RESEND_API_KEY`), не SMTP |

## Не входит в скоуп

- Локализация писем (EN/RU) — только UA.
- Письмо при возврате заказа в `pending`.
- PDF-инвойс / вложения.
- Вебхуки трекинга от Нової Пошти.

---

## Архитектура

### Откуда берём email — вариант A (снапшот в заказе)

Email клиента нет ни в `orders`, ни в `profiles` (там только `user_id`; email живёт в `auth.users`). Заказ уже снапшотит получателя (`recipient_first_name/last_name/phone`, `city`, `nova_poshta_branch`) вместо джойна с профилем. Доснапшочиваем туда же email:

- **Миграция** `supabase/migrations/0003_order_recipient_email.sql`: `ALTER TABLE orders ADD COLUMN recipient_email text;` (nullable — старые заказы остаются с NULL).
- В `placeOrder` пишем `user.email` в `recipient_email` (объект `user` уже получаем через `getUser()`).
- Все точки отправки читают `order.recipient_email` напрямую — **service-role не нужен**, админский PATCH-роут берёт колонку обычным staff-клиентом.
- `database.types.ts` дополняется полем `recipient_email` в Row/Insert/Update таблицы `orders`.

### Модуль `src/lib/notify/email.ts` (зеркало `telegram.ts`)

```ts
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

// Pure: builds the localized subject + branded HTML. No network/env. Unit-tested.
export function formatCustomerOrderEmail(o: OrderEmailData, event: OrderEmailEvent): { subject: string; html: string }

// Side effect: POST to Resend. No-ops when RESEND_API_KEY missing or email is null.
// Throws only on transport failure — callers wrap so it never breaks the action.
export async function sendCustomerOrderEmail(o: OrderEmailData, event: OrderEmailEvent): Promise<void>
```

- Sender: `TradeM <no-reply@xn--80aid2aql.com.ua>`.
- HTML — брендированный шаблон в стиле auth-писем (тёмный фон `#0e0e0a`, золото `#ecc246/#c9a227`, лого `https://традем.com.ua/logo.png`, футер с контактами). Инлайн-стили (email-safe).
- Per-event: заголовок, вступление, статус-метка, акцент CTA. Тело включает короткий id (`#abcdef12`), позиции, сумму, доставку (місто/відділення), ссылку на `/dashboard/orders`.
- Экранирование пользовательских полей (имя, комментарий) в HTML (`& < >`).

### Subject по событиям (UA)

| event | subject |
|---|---|
| placed | `Замовлення #XXXXXXXX прийнято — TradeM` |
| confirmed | `Замовлення #XXXXXXXX підтверджено — TradeM` |
| shipped | `Замовлення #XXXXXXXX відправлено — TradeM` |
| delivered | `Замовлення #XXXXXXXX доставлено — TradeM` |
| cancelled | `Замовлення #XXXXXXXX скасовано — TradeM` |

---

## Триггеры

| Событие | Файл | Вызов |
|---|---|---|
| Оформление (pending) | `src/lib/cart/actions.ts` → `placeOrder` | `sendCustomerOrderEmail(data, 'placed')` после insert, рядом с `notifyDirectorNewOrder` |
| Отмена клиентом | `src/lib/orders/actions.ts` → `cancelOrder` | `sendCustomerOrderEmail(data, 'cancelled')` рядом с `notifyDirectorOrderCancelled` (расширить SELECT: добавить `recipient_email`, `city`, `nova_poshta_branch`) |
| Смена статуса админом | `src/app/api/admin/orders/[id]/route.ts` → `PATCH` | `sendCustomerOrderEmail(data, status)` для status ∈ {confirmed, shipped, delivered, cancelled} |

Все письма — **в дополнение** к Telegram-уведомлениям, не вместо.

### Идемпотентность админского PATCH

Сейчас PATCH всегда делает `update`. Меняем на:
1. `SELECT *` заказа по id (нужны статус, `recipient_email`, items, total, имя, місто/відділення, promo).
2. Если не найден → 404.
3. Если `order.status === status` → ничего не делаем (нет смены), возвращаем `{ ok: true }` без письма.
4. Иначе `update({ status })`, затем — если `status !== 'pending'` — `sendCustomerOrderEmail(data, status)`.

Это исключает дублирующие письма при повторном сохранении того же статуса.

---

## Конфиг (env)

Новая переменная **`RESEND_API_KEY`** (тот же ключ Resend) — в `.env.local` (локально) и в Vercel (prod). `.env.local` в `.gitignore` — секрет не коммитим.

> Это **отдельно** от Supabase Auth SMTP: Auth-письма Supabase шлёт по SMTP (креды в дашборде Supabase), а письма о заказе наше приложение шлёт напрямую через Resend API. Аккаунт / домен / From — общие.

## Обработка ошибок и edge cases

- `sendCustomerOrderEmail` обёрнут в try/catch на каждом колл-сайте — ошибка логируется и глотается, чекаут / отмена / смена статуса не ломаются (как у Telegram).
- Нет `RESEND_API_KEY` (локально) или `recipient_email === null` (старый заказ) → тихий no-op.
- Resend вернул не-2xx → бросаем (колл-сайт ловит и логирует).

## Тестирование

Юнит-тесты `src/lib/notify/email.test.ts` (env `node`, в стиле `telegram.test.ts`):
- `formatCustomerOrderEmail` для каждого из 5 событий: subject содержит короткий id и нужное слово (`прийнято`/`підтверджено`/`відправлено`/`доставлено`/`скасовано`); html содержит id, сумму, позиции, ссылку на dashboard.
- Экранирование: имя с `<` не ломает HTML.

## Критерии готовности

- [ ] Миграция применена; `orders.recipient_email` есть; `database.types.ts` обновлён.
- [ ] Новый заказ → клиенту приходит письмо «прийнято» (от TradeM), директору — Telegram (как раньше).
- [ ] Отмена клиентом и смена статуса админом (confirmed/shipped/delivered/cancelled) → клиенту приходит соответствующее письмо.
- [ ] Повторное сохранение того же статуса в админке письмо не шлёт.
- [ ] Юнит-тесты зелёные (`npm test`); `npm run build` и `npx tsc --noEmit` без ошибок.
- [ ] Без `RESEND_API_KEY` всё работает (no-op), чекаут/отмена/смена статуса не падают.
