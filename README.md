<div align="center">

# ⛏️ TradeM

**Premium e-commerce та сервісна платформа для ASIC-майнерів**
*(Antminer, Whatsminer, Avalon та ін.)*

Слоган бренду — **«Industrial Excellence»**.
Тримовний інтерфейс: 🇺🇦 українська (за замовчуванням) · 🇬🇧 англійська · 🇷🇺 російська (прихована SEO-локаль).

[![Live](https://img.shields.io/badge/▶_Live-традем.com.ua-39d353?style=for-the-badge)](https://традем.com.ua)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)

</div>

Напрямки: продаж обладнання, ремонт і діагностика, прошивка/налаштування, майнінг-готель (co-location).

---

## ✨ Можливості

- **Каталог ASIC** з фасетними фільтрами (бренд, алгоритм, монета, тип охолодження, діапазони ціни та потужності), пошуком, сортуванням і пагінацією «показати ще».
- **Сторінка товару** — селектор конфігурацій (варіанти хешрейту), технічні характеристики, схожі моделі, міні-калькулятор прибутковості, а для топ-сімейств Antminer — кураторський SEO-опис + FAQ зі схемою `FAQPage`.
- **Калькулятор прибутковості** на живих даних [WhatToMine](https://whattomine.com) — SHA-256, Scrypt (DOGE+LTC merge), KHeavyHash, EthHash, Eaglesong, Equihash, X11, RandomX. ROI рахується за 24-годинним середнім; **тариф на електрику — у гривнях** із перерахунком у USD за живим курсом НБУ.
- **Тримовність (i18n)** на `next-intl`: UA — основна, EN — повноцінна, RU — **прихована SEO-локаль** (немає в UI, але в `sitemap` + `hreflang`). Перемикач мов; на `/ru` — модалка з пропозицією перейти на українську версію сторінки.
- **SEO-хаби за алгоритмами та брендами** — `/asic/sha256`, `/asic/scrypt`, `/asic/kaspa`, `/asic/zcash`, `/asic/antminer`, `/asic/avalon`, `/asic/fluminer`: keyword-first H1/meta, розгорнутий контент-блок, 6-питальний FAQ + `FAQPage` JSON-LD.
- **Блог** (`/blog`) — контент-кластер на Markdown: 15 статей × 3 мови, рендер через `react-markdown`, схема `BlogPosting` + `BreadcrumbList`, canonical/hreflang, внутрішні лінки на хаби та калькулятор.
- **Автосинхронізація каталогу** з Google Sheets → Supabase (Vercel Cron щодня + миттєвий webhook; атомарний RPC `sync_products`).
- **Авторизація** (Supabase Auth, SSR) — реєстрація, вхід, скидання пароля.
- **Особистий кабінет** — профіль і історія замовлень.
- **Адмін-панель** (захист за роллю) — керування замовленнями, користувачами, товарами, промокодами, відгуками та фото; ручний запуск синхронізації.
- **Кошик → Оформлення замовлення** — атомарний RPC `place_order` (валідація + промокод + вставка замовлення в одній транзакції); Telegram-повідомлення директору та лист покупцеві через Resend. Онлайн-оплати немає: замовлення створюється як `pending` і ведеться вручну в `/admin/orders`, зміна статусу теж надсилає лист. Усі сповіщення не працюють без своїх env-змінних і ніколи не ламають оформлення.
- **IP-ліміти** — `rate_limit_check` Postgres RPC, викликається з `src/proxy.ts`: 10 запитів/хв на `/login`, `/register`, `/auth/reset-password` і 5 запитів/хв на `/checkout`. Перевірка fail-open — збій Supabase не блокує користувачів.
- **UI-деталі** — крипто-тікер курсів, hero-карусель, біжучий рядок брендів, **карусель відгуків** (авто-скрол, clamp/expand), Open Graph для лінк-прев'ю, ambient-фон (CSS-градієнт + grain), перемикач теми (темна/світла), `@vercel/otel` інструментація.

---

## 🧱 Стек

| Шар | Технологія |
|---|---|
| Фреймворк | Next.js 16 (App Router) + React 19 + TypeScript |
| Локалізація | `next-intl` (uk / en / ru-прихована) |
| Стилі | Tailwind CSS 4 + кастомні класи в `src/app/globals.css` (`@theme`) |
| БД + Auth | Supabase (PostgreSQL + Auth SSR + RLS) через `@supabase/ssr` |
| Контент | Markdown (`react-markdown`, `remark-gfm`, `gray-matter`) |
| Анімації | Чистий CSS (transitions/keyframes) + `IntersectionObserver` — без Framer Motion |
| Шрифти | Unbounded, Manrope, JetBrains Mono (`next/font`) + Material Symbols (self-hosted) |
| Сповіщення | Telegram Bot API + Resend (обидва через REST, без SDK) |
| Тести | Vitest + Testing Library + jsdom |
| Observability | `@vercel/otel` (`src/instrumentation.ts`) |
| Деплой | Vercel (+ Vercel Cron) |

---

## ⚡ Запуск

```bash
npm install
npm run dev      # http://localhost:3000
```

Скрипти: `npm run dev` · `npm run build` · `npm run start` · `npm run lint` · `npm test` · `npm run test:watch`

### Змінні оточення (`.env.local`)

```bash
NEXT_PUBLIC_SUPABASE_URL=        # URL проєкту Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # публічний anon-ключ
SUPABASE_SERVICE_ROLE_KEY=       # service-role ключ (синхронізація товарів)
SYNC_SECRET=                     # Bearer-токен для вебхука синхронізації
WHATTOMINE_API_KEY=              # ключ WhatToMine для калькулятора
# Опціональні (сповіщення про замовлення):
TELEGRAM_BOT_TOKEN=              # Telegram-повідомлення директору
TELEGRAM_DIRECTOR_CHAT_ID=
RESEND_API_KEY=                  # листи покупцеві; без ключа відправка просто не виконується
```

Повний перелік із коментарями — у `.env.example`.
На Vercel ці змінні задаються в **Settings → Environment Variables** (Production / Preview / Development).

### Тести та CI

```bash
npm test          # vitest run — юніт-тести поруч із кодом: src/**/*.test.ts(x)
npm run test:watch
```

`.github/workflows/ci.yml` на кожен push і PR у `main` проганяє `lint → test → build` на Node 24
(збірка використовує плейсхолдери `NEXT_PUBLIC_SUPABASE_*`, реальні значення підставляє Vercel при деплої).

---

## 🗂 Архітектура даних

```
Google Sheets (прайс)
      │  CSV export, парсинг у src/lib/sheets.ts
      ▼
/api/sync-products  ──┐  Vercel Cron (щодня 03:00) — GET
   (sync_products RPC) │  Apps Script webhook (миттєво) — POST + Bearer SYNC_SECRET
      ▼               │
Supabase `products` ◀─┘
      │  src/lib/products.ts (читання на сервері, ISR)
      ▼
Каталог / головна / сторінка товару
```

Калькулятор окремо тягне дохідність з WhatToMine (`src/lib/minerstat.ts`, `revalidate: 300`)
та курс гривні з НБУ для тарифу на електрику.

### Таблиці Supabase

| Таблиця | Опис |
|---|---|
| `profiles` | Роль `customer` / `admin` / `director` |
| `products` | Синхронізується з Google Sheets; `image_url_admin` встановлюється через `/admin/photos` |
| `orders` | `items` JSONB, статус, промокод, отримувач, Нова Пошта |
| `promo_codes` | Знижки, ліміти, термін дії |
| `reviews` | Кураторські відгуки; керуються в `/admin/reviews`; живлять `ReviewsCarousel` + `AggregateRating` |

Типи — `src/lib/types/database.types.ts`.

**DB-функції (RPC):** `validate_promo`, `redeem_promo`, `cancel_order`, `place_order` (атомарний замовлення+промокод), `sync_products` (атомарний upsert+видалення), `random_products`, `rate_limit_check`.

---

## 🧭 Маршрути

Усі сторінки під префіксом локалі (`/`, `/en/…`, `/ru/…`).

| Сторінка | Шлях |
|---|---|
| Головна | `/` |
| Каталог | `/products` |
| Товар | `/products/[slug]` |
| SEO-хаби | `/asic/sha256` · `/asic/scrypt` · `/asic/kaspa` · `/asic/zcash` · `/asic/antminer` · `/asic/avalon` · `/asic/fluminer` |
| Блог | `/blog`, `/blog/[slug]` |
| Сервіси | `/services` |
| Калькулятор | `/calculator` |
| Контакти | `/contact` |
| Кошик → Оформлення | `/cart`, `/checkout` |
| Авторизація | `/login`, `/register`, `/auth/reset-password`, `/auth/callback` |
| Кабінет | `/dashboard`, `/dashboard/profile`, `/dashboard/orders` |
| Адмінка | `/admin`, `/admin/orders`, `/admin/users`, `/admin/users/[id]`, `/admin/products`, `/admin/promos`, `/admin/reviews`, `/admin/photos` |

Доступ до `/dashboard` та `/admin` обмежено в `src/proxy.ts` (Next.js 16: `middleware` → `proxy`); роль `admin`/`director` додатково перевіряється в layout та API.
