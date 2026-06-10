# План SEO: топ Google по «купить asic / bitmain / antminer» — 2026-06-10

Цель: попадание в топ-10 Google (Украина) по транзакционным головным запросам
«купить asic / купити асік», «antminer купить», «bitmain украина» и модельным
запросам («antminer s21 купить» и т.п.).

## Данные и ограничения
- **Каталог (Supabase, 2026-06-10):** 62 модели, из них **AntMiner — 49**, FluMiner 4,
  Avalon 3, Pinecone 3, ElphaPex 2, VolcMiner 1. В наличии — 1 шт, остальное PreOrder.
  Цены $650–$30 800.
- **Search Console: ❌ не авторизован** (`Authentication required`) — реальных позиций,
  показов и CTR нет. План опирается на каталог + on-page состояние; после re-auth
  приоритеты пересчитать по фактическим запросам.
- **On-page уже сильное:** schema Product/Offer/FAQ/Breadcrumb/Organization, hreflang
  uk/en/ru, 4 алгоритмических хаба (`/asic/sha256` и др.), SEO-копия и FAQ на карточках
  (см. `2026-06-09-seo-backlog.md`).

## Карта «запрос → страница»

| Группа запросов | Целевая страница | Состояние |
|---|---|---|
| купить asic, купити асік, asic майнер цена | `/` (title уже «Купити ASIC-майнер…») + `/products` | есть, но головная конкуренция; нужен траст домена + контент |
| antminer, antminer купить, asic antminer | **НЕТ страницы** → новый брендовый хаб `/asic/antminer` | главный контентный пробел (49/62 каталога!) |
| bitmain, bitmain украина, bitmain купить | тот же хаб (Bitmain = производитель Antminer) | чисто «bitmain» — навигационный на bitmain.com, реально выигрывать «bitmain купить/украина» |
| antminer s21 купить (модельные) | карточки `/products/[slug]` | уже хорошо (копия + FAQ + schema) |
| asic sha-256 / scrypt и т.п. | алгоритмические хабы | 4 из 8 алгоритмов покрыты |

---

## Фаза 0 — Фундамент (блокеры; без них остальное буксует)

1. **Кастомный домен вместо `trade-mua.vercel.app`.** На shared-поддомене vercel.app
   выйти в топ по коммерческим головным запросам почти нереально: нулевые
   бренд-сигналы, домен не «свой», конкуренты — на аккуратных .ua/.com.ua.
   Действия: купить домен (напр. `trademua.com.ua`), привязать в Vercel, 301 со
   старого, заменить hardcoded URL в `layout.tsx`, `sitemap.ts`, `robots.ts`,
   `products/page.tsx`, `products/[slug]/page.tsx`, новый property в GSC.
   *Решение и покупка — за владельцем.*
2. **Re-auth Google Search Console MCP** (см. memory `reference-gsc-ga4-mcp-setup`) +
   отправить sitemap, проверить индексацию ключевых URL (`inspection_inspect`).
3. **Google Business Profile** для офисов Киев + Днепр → локальный пак и Maps по
   «купить asic киев / asic магазин днепр». Привязать к `Organization`/`LocalBusiness`
   schema (п. 8).

## Фаза 1 — Брендовые хабы (главный рычаг под «antminer / bitmain»)

4. **Создать хаб `/asic/antminer` (Bitmain Antminer).** H1 «ASIC-майнери Bitmain
   Antminer», вводный блок (бренд, линейки S/T/L/K, гарантия, доставка по Украине),
   лайнап всех 49 моделей (ItemList schema), 6 FAQ (FAQPage), перелинковка
   карточки ↔ хаб ↔ калькулятор. UA+RU через `trademua-content-ua`; добавить в
   `sitemap.ts`. Технически — расширить механику HUBS в `asic/[algorithm]/page.tsx`
   на бренды либо отдельный route `asic/antminer`.
5. **Хаб Avalon** по той же схеме; позже FluMiner/ElphaPex (Scrypt/DOGE-спрос).

## Фаза 2 — Технические quick wins (из бэклога 2026-06-09, усиливают всё)

6. Self-canonical на `/products` и `/products/[slug]` (фасетные параметры размывают индекс).
7. `Offer` → `shippingDetails` + `hasMerchantReturnPolicy` (полный rich result цены/наличия).
8. `Organization` → `address` (Киев, Днепр), `telephone`, `contactPoint`, `sameAs`.
9. Хлебные крошки через хаб (Home › Каталог › SHA-256 › Модель), OG-image 1200×630,
   `lastModified` в sitemap.

## Фаза 3 — Контент-кластер под «купить asic»

10. Усилить `/products` как хаб «купити ASIC-майнер»: SEO-текст под листингом
    (бренды, цены, доставка, гарантия) + FAQ + FAQPage schema.
11. Блог-статьи с перелинковкой на хабы/карточки: «Як вибрати ASIC у 2026»,
    «Окупність ASIC-майнера», «Antminer S21 vs S19k Pro», «Шум та живлення ASIC».
12. Дозаполнить алгоритмические хабы — 4 алгоритма из 8 без хабов.

## Фаза 4 — Off-page (для головных запросов решает не меньше on-page)

13. **Google Merchant Center** — бесплатные листинги (feed из Supabase) → Shopping-таб
    и расширенные сниппеты.
14. Прайс-агрегаторы/каталоги UA: hotline.ua, prom.ua, картографические справочники —
    ссылки + брендовые упоминания.
15. Крауд/PR: профильные Telegram-каналы и форумы майнеров, отзывы на внешних
    площадках (привязать к GBP).

## Фаза 5 — Измерение и итерации

16. После re-auth GSC ежемесячно: `seo_striking_distance` (позиции 8–15 → топ),
    `seo_low_ctr_opportunities` (показы есть, кликов нет → правка title/description),
    `seo_cannibalization` (хаб vs карточки vs главная по «antminer»).

## Реалистичные ожидания
- Модельные запросы («antminer s21 купить») — самые достижимые, недели после хаба и линковки.
- «antminer купить», «bitmain украина» — 2–3 месяца после хаба + домена.
- Головной «купить asic» — 4–6+ месяцев, зависит от домена, ссылок и поведенческих.
- Чисто «bitmain» / «antminer» без модификаторов — навигационные на сайт производителя;
  цель по ним — присутствие в топ-10, не #1.
- ⚠️ Коммерческий момент: 61/62 товара PreOrder — трафик придёт, но конверсию ограничит наличие.

## Следующие действия (по приоритету)
1. Решение по кастомному домену (владелец) — фаза 0.1.
2. Re-auth GSC (владелец, OAuth) — фаза 0.2.
3. ~~Код сейчас: брендовый хаб `/asic/antminer` (п. 4) + quick wins (п. 6–8)~~ — **✅ сделано 2026-06-10**.

## Выполнено 2026-06-10
- **Хаб `/asic/antminer`** (uk/ru/en): расширен механизм HUBS (`dbBrand`), 49 моделей AntMiner
  с per-product доходностью, intro + body + 6 FAQ, BreadcrumbList/ItemList/FAQPage schema,
  добавлен в sitemap. Title: «Antminer — купити ASIC-майнери Bitmain в Україні».
- **Анти-каннибализация:** sha256-хаб перенацелен с «Купити Antminer» на
  «Купити ASIC для майнінгу Bitcoin (SHA-256)» (title/H1/description/bodyHeading, 3 локали) —
  брендовый запрос теперь принадлежит хабу antminer.
- **Canonical** на `/products` и `/products/[slug]` (все локали).
- **Offer**: `shippingDetails` (UA, Нова Пошта, handling 0–1 дн. in stock / 10–14 дн. PreOrder,
  transit 1–3 дн.; `shippingRate` не указан — нет подтверждённого тарифа/бесплатной доставки) +
  `hasMerchantReturnPolicy` (14 дн., возврат за счёт покупателя — **подтвердить у владельца**:
  вычислительная техника может попадать под перечень невозвратных товаров, КМУ №172).
- **Organization**: telephone +380974225060, contactPoint (sales, UA, uk/ru),
  sameAs (t.me/BOSSDnepra), адреса офисов Киев + Днепр (локализуются через messages).
- Проверено: `tsc` чисто, прод-сборка, рендер uk/ru хаба, карточки и каталога — canonical и
  все JSON-LD на месте.
