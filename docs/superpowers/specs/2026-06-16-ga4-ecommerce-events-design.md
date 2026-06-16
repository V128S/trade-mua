# Спека: GA4 E-commerce события

**Дата:** 2026-06-16
**Статус:** утверждён дизайн, готов к плану реализации
**Ветка:** `feat/ga4-ecommerce-events`

## Проблема

Магазин слеп с точки зрения аналитики. В `src/app/[locale]/layout.tsx` GA4 подключён вручную через `<Script>` (`lazyOnload`, prod-only) и шлёт только `gtag('config', 'G-PFXVHGW9JT')` — то есть фиксирует исключительно просмотры страниц. Нет ни одного e-commerce события (`view_item`, `add_to_cart`, `begin_checkout`, `purchase`), поэтому невозможно:

- измерить воронку покупки и точки оттока;
- считать конверсию, доход и популярность моделей через отчёты GA4 Monetization;
- оценивать эффект SEO/контента в деньгах, а не только в трафике.

## Цель

Покрыть всю e-commerce воронку стандартными GA4-событиями (Enhanced Ecommerce), отправляемыми из централизованного типизированного модуля. Без изменения текущей загрузки GA и без баннера согласия.

## Решения (из брейнсторминга)

| Вопрос | Решение |
|---|---|
| Охват событий | **Полная воронка** — 9 событий (см. ниже) |
| Согласие/баннер | **Не трогаем** — GA грузится как сейчас (prod-only, безусловно). Consent Mode/баннер — отдельной задачей |
| Валюта `value` | **`USD`** — цены и `total_usdt` по всему сайту в USDT, репортим консистентно как USD |
| Архитектура | **Централизованный типизированный модуль** `src/lib/analytics/` с чистыми мапперами и guard-хелпером |

## Не входит в скоуп

- Consent Mode v2 и cookie-баннер.
- Server-side Measurement Protocol (все события — клиентские).
- Событие `refund` и трекинг отмен.
- Миграция на GTM-контейнер.
- E-commerce трекинг в админке/кабинете.

---

## Архитектура

Новый модуль `src/lib/analytics/`:

```
src/lib/analytics/
├── gtag.ts        # низкоуровневый guard-хелпер gtagEvent()
├── gtag.d.ts      # типизация Window.gtag
├── items.ts       # чистые мапперы Product/CartItem → GA4 item (тестируемо)
├── events.ts      # типизированные функции на каждое событие
├── TrackView.tsx  # клиентские обёртки для серверных страниц (useEffect)
└── index.ts       # ре-экспорт публичного API
```

### `gtag.ts` — единая точка отправки

```ts
export function gtagEvent(name: string, params: Record<string, unknown>): void
```

- Guard: `typeof window !== 'undefined' && typeof window.gtag === 'function'`. Иначе — тихий no-op (безопасно в dev, на сервере и до загрузки GA).
- **Никогда не бросает** — оборачивает вызов в try/catch, ошибку глотает. Аналитика не должна ломать UX.
- Dev-наблюдаемость: при `process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === '1'` дополнительно пишет `console.debug('[ga]', name, params)`. Позволяет проверять payload в dev, где GA не грузится. Прод-загрузку GA не меняет.

### `gtag.d.ts` — типы

```ts
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}
export {}
```

### `items.ts` — мапперы (чистые, без браузера)

```ts
interface GAItemSource {
  id: string
  name: string
  brand?: string | null
  algorithm?: string | null
  priceUSDT: number
}
interface GAItemOpts { quantity?: number; index?: number; listId?: string; listName?: string }

function toGAItem(src: GAItemSource, opts?: GAItemOpts): GAItem
function toGAItems(srcs: GAItemSource[], opts?: Omit<GAItemOpts, 'index'>): GAItem[]
```

Маппинг полей:

| GA4 поле | Источник | Примечание |
|---|---|---|
| `item_id` | `id` | slug/SKU из Sheet |
| `item_name` | `name` | |
| `item_brand` | `brand` | опускается, если нет (cart-события) |
| `item_category` | `algorithm` | напр. `SHA-256`; опускается, если нет |
| `price` | `priceUSDT` | число |
| `quantity` | `opts.quantity ?? 1` | |
| `index` | `opts.index` | только list/select события |
| `item_list_id` / `item_list_name` | `opts.listId/listName` | только list/select события |

`CartItem` (id, name, priceUSDT, qty — без brand/algorithm) маппится тем же `toGAItem`; отсутствующие поля просто опускаются (в GA4 все поля item, кроме `item_id`/`item_name`, опциональны).

### `events.ts` — типизированные события

Каждая функция строит payload и зовёт `gtagEvent`. Все денежные события несут `currency: 'USD'`.

```ts
trackViewItemList(srcs, { listId, listName })
trackSelectItem(src, { listId, listName, index })
trackViewItem(src)                                   // value = price
trackAddToCart(src, qty)                             // value = price * qty
trackRemoveFromCart(src, qty)                        // value = price * qty
trackViewCart(items, subtotal)                       // value = subtotal
trackBeginCheckout(items, { value, coupon })         // value = total
trackAddShippingInfo(items, { value, coupon })       // value = total, shipping_tier: 'Nova Poshta'
trackPurchase({ orderId, items, value, coupon })     // transaction_id, value, shipping: 0, tax: 0
```

### `TrackView.tsx` — мост для серверных страниц

Серверные компоненты не могут звать `gtag` (браузерный). Тонкие клиентские обёртки (`'use client'`) с `useEffect(..., [])` для разовой отправки на маунте. Принимают **сериализуемый payload** (не функции):

- `<TrackProductView product={...} />` → `view_item`
- `<TrackProductList products={...} listId listName />` → `view_item_list` (если страница серверная)

---

## События и точки внедрения

| # | Событие | Файл / точка | value |
|---|---|---|---|
| 1 | `view_item_list` | `ProductsCatalog` (client) — видимый список; рейлы на главной | — |
| 2 | `select_item` | клик по `ProductCard` (с контекстом списка) | — |
| 3 | `view_item` | `ProductDetail` через `<TrackProductView>` | price |
| 4 | `add_to_cart` | `AddToCartButton.handleAdd` | price × qty |
| 5 | `remove_from_cart` | `CartView` (удаление/декремент) | price × qty |
| 6 | `view_cart` | маунт `/cart` (`CartView`) | subtotal |
| 7 | `begin_checkout` | маунт `CheckoutForm` (когда `hydrated && items.length`) | total |
| 8 | `add_shipping_info` | сабмит `CheckoutForm` (перед `placeOrder`) | total |
| 9 | `purchase` | `CheckoutForm` после `placeOrder` success, **до `clear()`** | total |

### Детали ключевых точек

**`purchase` (критично).** В `CheckoutForm.handleSubmit` после `placeOrder` вернувшего `orderId`, до `clear()` и `router.push`, ещё доступны `items`, `total`, `promo`. Шлём:

```ts
trackPurchase({
  orderId: res.orderId,
  items: toGAItems(items),
  value: total,
  coupon: promo?.code,
})
```

Это гарантирует **ровно один выстрел** без отдельной thank-you-страницы. `transaction_id = orderId` дополнительно дедуплицирует в GA. Событие не шлётся на `/dashboard/orders?success=…`.

**`begin_checkout` / `add_shipping_info`.** `begin_checkout` — на маунте `CheckoutForm` (один раз, когда корзина гидрирована и непуста). `add_shipping_info` — на сабмите, до `placeOrder`, с `shipping_tier: 'Nova Poshta'`.

**`view_item_list` / `select_item`.** `ProductsCatalog` — клиентский (фильтры/сортировка), поэтому `view_item_list` шлём оттуда по текущему видимому срезу, `select_item` — по клику в `ProductCard`. Контекст списка (`item_list_id`/`item_list_name`, напр. `catalog` / `home_top` / `similar`) прокидывается в `ProductCard` пропсом.

---

## Тестирование

В стиле существующих тестов (`src/lib/cart/cart-math.test.ts`), vitest:

1. **`items.test.ts`** — `toGAItem`/`toGAItems`: корректные поля, опускание `brand`/`algorithm` при отсутствии, `index`, list-контекст.
2. **`gtag.test.ts`** — `gtagEvent`: no-op без `window.gtag` (не бросает); зовёт `window.gtag('event', name, params)` при наличии (мок); не бросает при исключении внутри `gtag`.
3. **`events.test.ts`** — выборочно: `trackPurchase` формирует `transaction_id`/`currency`/`value`/`coupon`/`items`; `trackAddToCart` считает `value = price*qty`.

Ручная проверка: GA4 **DebugView** на превью/проде + `NEXT_PUBLIC_ANALYTICS_DEBUG=1` для логов payload в dev-консоли.

## Обработка ошибок и edge cases

- `gtagEvent` — fire-and-forget, обёрнут в try/catch, никогда не ломает рендер/сабмит.
- `purchase` — единичный выстрел (в `CheckoutForm` до редиректа).
- `view_item` / `begin_checkout` / `view_cart` — один раз на маунт (через `useEffect([])` или гард-флаг).
- SSR-safe: все вызовы — в клиентских компонентах/эффектах; мапперы чистые, но исполняются client-side.
- До загрузки GA (`lazyOnload`) `window.gtag` ещё нет → событие тихо теряется. Приемлемо: ранние события (view_item) обычно после idle; критичный `purchase` происходит сильно позже загрузки GA.

## Критерии готовности

- [ ] Все 9 событий видны в GA4 DebugView с корректным payload (`items[]`, `currency`, `value`, `transaction_id`).
- [ ] Воронка в GA4 (Explore → Funnel) строится: `view_item → add_to_cart → begin_checkout → purchase`.
- [ ] Юнит-тесты на мапперы/guard/выборочные события зелёные (`npm test`).
- [ ] `npm run build` и `npm run lint` без ошибок.
- [ ] Никаких регрессий UX: события не ломают добавление в корзину, чекаут, навигацию.
