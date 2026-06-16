<div align="center">

# ⛏️ TradeM

**Premium e-commerce та сервісна платформа для ASIC-майнерів**
*(Antminer, Whatsminer, Avalon та ін.)*

Слоган бренду — **«Industrial Excellence»**.
Тримовний інтерфейс: 🇺🇦 українська (за замовчуванням) · 🇷🇺 російська · 🇬🇧 англійська.

[![Live](https://img.shields.io/badge/▶_Live-trade--mua.vercel.app-39d353?style=for-the-badge)](https://trade-mua.vercel.app)
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
- **SEO-хаби за алгоритмами** — `/asic/sha256`, `/asic/scrypt`, `/asic/kaspa`, `/asic/zcash`: keyword-first H1/meta, розгорнутий контент-блок, 6-питальний FAQ + `FAQPage` JSON-LD під «купити Antminer …».
- **Блог** (`/blog`) — контент-кластер на Markdown: 3 pillar-статті × 3 мови, рендер через `react-markdown`, схема `BlogPosting` + `BreadcrumbList`, canonical/hreflang, внутрішні лінки на хаби та калькулятор.
- **Автосинхронізація каталогу** з Google Sheets → Supabase (Vercel Cron щодня + миттєвий webhook).
- **Авторизація** (Supabase Auth, SSR) — реєстрація, вхід, скидання пароля.
- **Особистий кабінет** — профіль і історія замовлень.
- **Адмін-панель** (захист за роллю) — керування замовленнями, користувачами, промокодами та ручний запуск синхронізації товарів.
- **UI-деталі** — крипто-тікер курсів, hero-карусель, біжучий рядок брендів, **карусель відгуків** (авто-скрол із безкінечним циклом, clamp/expand, перемішування), Open Graph для лінк-прев'ю (Telegram тощо), ambient-фон (CSS-градієнт + grain), перемикач теми (темна/світла).

---

## 🧱 Стек

| Шар | Технологія |
|---|---|
| Фреймворк | Next.js 16 (App Router) + React 19 + TypeScript |
| Локалізація | `next-intl` (uk / ru-прихована / en) |
| Стилі | Tailwind CSS 4 + кастомні класи в `src/app/globals.css` (`@theme`) |
| БД + Auth | Supabase (PostgreSQL + Auth SSR + RLS) через `@supabase/ssr` |
| Контент | Markdown (`react-markdown`, `remark-gfm`, `gray-matter`) |
| Анімації | Framer Motion + CSS / IntersectionObserver |
| Шрифти | Syne, Hanken Grotesk, JetBrains Mono (`next/font`) + Material Symbols |
| Деплой | Vercel (+ Vercel Cron) |

---

## ⚡ Запуск

```bash
npm install
npm run dev      # http://localhost:3000
```

Скрипти: `npm run dev` · `npm run build` · `npm run start` · `npm run lint` · `npm test`

### Змінні оточення (`.env.local`)

```bash
NEXT_PUBLIC_SUPABASE_URL=        # URL проєкту Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # публічний anon-ключ
SUPABASE_SERVICE_ROLE_KEY=       # service-role ключ (синхронізація товарів)
SYNC_SECRET=                     # Bearer-токен для вебхука синхронізації
WHATTOMINE_API_KEY=              # ключ WhatToMine для калькулятора
```

На Vercel ці змінні задаються в **Settings → Environment Variables** (Production / Preview / Development).

---

## 🗂 Архітектура даних

```
Google Sheets (прайс)
      │  CSV export, парсинг у src/lib/sheets.ts
      ▼
/api/sync-products  ──┐  Vercel Cron (щодня 03:00) — GET
   (upsert + cleanup) │  Apps Script webhook (миттєво) — POST + Bearer SYNC_SECRET
      ▼               │
Supabase `products` ◀─┘
      │  src/lib/products.ts (читання на сервері, ISR)
      ▼
Каталог / головна / сторінка товару
```

Калькулятор окремо тягне дохідність з WhatToMine (`src/lib/minerstat.ts`, `revalidate: 300`)
та курс гривні з НБУ для тарифу на електрику.

### Таблиці Supabase

`profiles` (роль customer/admin) · `products` (синк з Sheets) · `orders` (items JSONB, статуси, промокод) · `promo_codes`.
Типи — `src/lib/types/database.types.ts`.

---

## 🧭 Маршрути

Усі сторінки під префіксом локалі (`/`, `/ru`, `/en`).

| Сторінка | Шлях |
|---|---|
| Головна | `/` |
| Каталог | `/products` |
| Товар | `/products/[slug]` |
| SEO-хаби за алгоритмами | `/asic/sha256` · `/asic/scrypt` · `/asic/kaspa` · `/asic/zcash` |
| Блог | `/blog`, `/blog/[slug]` |
| Сервіси | `/services` |
| Калькулятор | `/calculator` |
| Про нас / Контакти | `/about`, `/contact` |
| Кошик | `/cart` |
| Авторизація | `/login`, `/register`, `/auth/reset-password`, `/auth/callback` |
| Кабінет | `/dashboard`, `/dashboard/profile`, `/dashboard/orders` |
| Адмінка | `/admin`, `/admin/orders`, `/admin/users`, `/admin/users/[id]`, `/admin/products`, `/admin/promos` |

Доступ до `/dashboard` та `/admin` обмежено в `src/middleware.ts`; роль `admin` додатково перевіряється в layout та API.

---

## 🎨 Дизайн

Дві теми (перемикач у навбарі, темна — за замовчуванням):

- **Темна — «Industrial Excellence»**: `Design/DESIGN.md`, `Design/code.html`
- **Світла — «Industrial Glassmorphism»**: `Design/DESIGN1light.md`, `Design/code1light.html`

Усі токени — у `src/app/globals.css` (`@theme` для темної + `html.light` оверрайди).
