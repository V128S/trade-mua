# Уведомление директору о новом заказе (Telegram)

**Дата:** 2026-06-07
**Статус:** утверждён

## Цель

При успешном оформлении заказа директор магазина получает в Telegram сообщение
с деталями заказа и ссылкой в админку. Канал — только Telegram, получатель —
лично директор (один `chat_id`). Сбой Telegram не должен ломать оформление
заказа.

## Контекст

Чекаут уже полностью реализован:
- `src/components/cart/CheckoutForm.tsx` — форма (имя, фамилия, телефон, город,
  отделение Новой Почты, комментарий).
- `src/lib/cart/actions.ts` → `placeOrder()` — валидирует поля, считает скидку по
  промокоду через RPC `redeem_promo`, вставляет заказ в Supabase `orders`,
  возвращает `{ orderId }`.
- Админка заказов — список `/admin/orders` (детальной страницы нет).

Системы уведомлений и env-ключей для Telegram пока нет.

## Объём (scope)

Единственная новая функциональность — врезать уведомление директору в конец
`placeOrder` после успешного `insert`.

### Намеренно НЕ делаем (YAGNI)

Inline-кнопки, webhook для обработки нажатий, email-дубль, очереди/ретраи,
уведомление группе менеджеров.

## Архитектура

```
placeOrder() ... insert в orders → { orderId }        (существует)
                      │
                      └─► notifyDirectorNewOrder(order)   (добавляем)
                              try { fetch Telegram sendMessage }
                              catch { console.error, НЕ падаем }
```

### 1. Новый модуль `src/lib/notify/telegram.ts`

Две единицы с чёткими границами:

- `formatOrderMessage(order): string` — **чистая функция**. Формирует HTML-текст
  сообщения. Экранирует пользовательские поля (имя, комментарий) под
  `parse_mode: "HTML"`, чтобы спецсимволы не ломали разметку. Тестируется
  изолированно, без сети.
- `notifyDirectorNewOrder(order): Promise<void>` — побочный эффект. Читает env,
  если `TELEGRAM_BOT_TOKEN` или `TELEGRAM_DIRECTOR_CHAT_ID` не заданы — тихий
  no-op (локалка без ключей работает). Иначе `POST` на
  `https://api.telegram.org/bot<token>/sendMessage` с
  `{ chat_id, text, parse_mode: "HTML", disable_web_page_preview: true }`.

**Вход** `OrderNotification`:
```ts
interface OrderNotification {
  id: string
  items: OrderItem[]        // { name, qty, price_usdt }
  total: number
  firstName: string
  lastName: string
  phone: string
  city: string
  branch: string
  notes?: string | null
  promoCode?: string | null
  discountPct?: number | null
}
```

**Содержимое сообщения:**
- `🛒 Нове замовлення #<short id>`
- Клієнт: `<Імʼя Прізвище>`, телефон
- Список товарів: `• <Назва> ×<qty>` для каждой позиции
- Промокод и `−<pct>%`, если есть
- Сума: `$<total>`
- Доставка: `<місто>, <відділення НП>`
- Коментар (если есть)
- Ссылка: `https://trade-mua.vercel.app/admin/orders`

Базовый URL берём константой (как в `layout.tsx`/`sitemap.ts`), отдельного
`NEXT_PUBLIC_SITE_URL` не вводим.

### 2. Врезка в `placeOrder` (`src/lib/cart/actions.ts`)

После успешного `insert`, перед `return { orderId: order.id }`:

```ts
try {
  await notifyDirectorNewOrder({
    id: order.id,
    items: orderItems,
    total,
    firstName, lastName, phone, city, branch,
    notes,
    promoCode,
    discountPct: discountPct || null,
  })
} catch (e) {
  console.error('telegram notify failed', e)
}
```

Заказ уже в БД (источник правды), поэтому ошибка уведомления логируется и
проглатывается.

### 3. Env-переменные

- `TELEGRAM_BOT_TOKEN` — токен бота из @BotFather.
- `TELEGRAM_DIRECTOR_CHAT_ID` — chat_id директора.

Только серверные (без `NEXT_PUBLIC_`). Добавляются в `.env.local` (placeholder) и
в Vercel env. Без них модуль работает как no-op.

**Ручной сетап (делает владелец):** создать бота через @BotFather, директор
пишет боту `/start`, получить `chat_id` (например, через `@userinfobot` или
`getUpdates`).

## Тестирование

Юнит-тест `src/lib/notify/telegram.test.ts` (vitest) на `formatOrderMessage`:
- содержит номер заказа, имя клиента, телефон, сумму, город+отделение;
- перечисляет все позиции товаров;
- показывает строку промокода/скидки только когда они заданы;
- HTML-экранирует пользовательский ввод (имя/комментарий с `<`, `&`).

`notifyDirectorNewOrder` сеть в тестах не дёргает (проверяем только форматтер).

## Обработка ошибок

| Ситуация | Поведение |
|---|---|
| Нет env-ключей | Тихий no-op, заказ оформляется нормально |
| Telegram API вернул ошибку / сеть упала | `console.error`, заказ НЕ падает |
| Спецсимволы в пользовательских полях | HTML-экранирование в форматтере |
