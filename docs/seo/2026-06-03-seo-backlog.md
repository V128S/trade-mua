# SEO backlog — TradeMua — 2026-06-03

## Reality check (read first)

Google Search Console for `https://trade-mua.vercel.app/` over the last 90 days
(2026-03-02 → 2026-05-31) returns **3 impressions, 1 click, 0 query rows**. The
homepage is indexed; almost nothing else is earning impressions yet. **The site is
effectively brand-new in Google's eyes.**

Consequences for this backlog:
- There is **no "striking distance" / cannibalization data to mine** — those
  workflows need real impressions first. Re-run them in ~6–8 weeks.
- **Opportunity scores below are foundational, not demand-proven.** They reflect
  "this is what an ASIC shop must have on-page to be eligible to rank," grounded in
  the catalog, not in measured GSC demand. Labeled where speculative.
- Bare head terms (`asic`, `antminer`) are dominated by aged, link-heavy
  marketplaces. **Realistic order:** win model-level long-tail + local first, build
  authority, then compete for heads. This is a months-long game, not a one-PR fix.

The technical foundation is already strong: JSON-LD on home/product/category/
services, algorithm hubs at `/asic/[algorithm]`, sitemap (68 URLs), robots,
hreflang, canonical, Google site verification, clean `/ru` 301 handling. So the gap
is **keyword targeting in titles + content depth + off-page authority**, not plumbing.

## Catalog snapshot (value signal, from Supabase `products`)

| Algorithm / brand | Models | Price range | In stock |
|---|---|---|---|
| **SHA256 / AntMiner** (Bitcoin) | **29** | $800–$30,800 | 1 |
| Scrypt / AntMiner (LTC/DOGE) | 8 | $1,100–$7,150 | 0 |
| Equihash / AntMiner (ZEC) | 4 | $6,250–$8,500 | 0 |
| KHeavyHash / AntMiner (KAS) | 4 | $1,800–$2,300 | 0 |
| Scrypt / FluMiner | 3 | $888–$3,700 | 0 |
| Avalon / Scrypt / X11 / RandomX / others | 1–3 each | — | 0 |

- **SHA256 + AntMiner is the commercial core** — most models, highest ticket. The
  `/asic/sha256` hub = the "купити Antminer / Bitcoin ASIC" intent. Prioritize it.
- ✅ **Brand/inventory mismatch — resolved 2026-06-03:** Whatsminer is not sold, so
  all **sales/supplier copy now leads with "Bitmain Antminer & Avalon"** (the brands
  actually stocked). Whatsminer is intentionally kept ONLY in service contexts
  (repair testimonial, firmware support, LuxOS FAQ) — true claims we still want to
  rank for. Revisit if Whatsminer inventory is added.
- Most stock is "під замовлення" (in_stock≈0). Fine, but transactional copy should
  say "під замовлення, фіксована ціна" rather than imply immediate dispatch.

---

## Now — low effort, high leverage (ship this week)

### 1. Homepage title + description — add the primary keyword *(SHIPPED in this branch)*
- value 5, opportunity 4 (foundational), effort 1 → **priority highest**
- evidence: title was `Trade M | Кращий Партнер` — **zero** keyword; the single
  strongest on-page signal wasted on a tagline. Homepage carries the most authority.
- done: UA/RU/EN → `Купити ASIC-майнер: Antminer, Whatsminer | Trade M`; descriptions
  now lead with intent + add local (Київ/Дніпро).

### 2. Localized, commercial product-card titles *(SHIPPED in this branch)*
- value 4, opportunity 4 (model + "купити/ціна" long-tail is winnable), effort 2
- evidence: title was `${product.name} | Trade M` — same for all locales, no modifier.
- done: added `products.metaSlugTitle` per locale and wired it into
  `generateMetadata`. ~60 product pages now read UA `{name} — купити в Україні, ціна |
  Trade M`, RU `{name} — купить в Украине, цена | Trade M`, EN `{name} — buy in
  Ukraine | Trade M`.

### 3. `/asic/sha256` hub copy as the "Antminer / Bitcoin ASIC" landing
- value 5, opportunity 4, effort 2
- evidence: biggest, highest-ticket cluster; hub exists but intro/H1/FAQ are thin.
- do: keyword-rich H1 + intro + FAQ (UA/RU/EN) targeting "купити Antminer",
  "ASIC для біткоїна", model lineup; internal-link from homepage. Via
  `trademua-content-ua` + #schema FAQPage.

---

## Next — medium effort (this month)

### 4. Add an Equihash (ZEC) hub; audit hub coverage
- value 3, opportunity 2 (speculative), effort 3
- 4 ZEC models justify a hub; skip 1-model/0-stock algos (thin). Add to `HUBS` +
  `sitemap.ts`.

### 5. RU copywriting pass for hubs + top models
- value 4 (captures large RU-language demand now that /ru is crawlable), opp 4, effort 3
- the hidden RU locale only pays off if RU pages have real, well-keyworded copy, not
  just mechanical translation. Route through `trademua-content-ua` terminology rules.

### 6. Internal linking + breadcrumb depth
- value 3, opp 3, effort 2
- home → hubs → cards; cards → parent hub; calculator ↔ relevant models. Helps
  crawl + distributes authority to deep pages.

---

## Later — high effort / off-page (the real authority game)

### 7. Content cluster (guides/blog) for informational intent
- value 4 (topical authority + link magnet), opp 3 (speculative), effort 5
- pillar per use-case: "Який ASIC обрати 2026", "Що таке хешрейт", "ROI майнінгу" —
  link down to model cards + calculator. This is how you eventually earn the right to
  rank for head terms.

### 8. Off-page: Google Business Profile + Merchant Center + backlinks
- value 5, opp 4, effort 4 (mostly non-code)
- **Google Business Profile** for Київ + Дніпро offices → unlocks local "купити асик
  Київ/Дніпро" + Maps. **Merchant Center** → free product listings. **Backlinks** from
  crypto forums/catalogs/partners — the missing ingredient for competitive terms.

### 9. Resolve the Whatsminer copy-vs-stock mismatch — ✅ DONE 2026-06-03
- sales copy now "Bitmain Antminer & Avalon"; Whatsminer kept only in service copy.

---

## The single highest-leverage next action
Items 1 & 2 are shipped in this branch. **Next: item 3 — flesh out the `/asic/sha256`
hub** as the "купити Antminer / Bitcoin ASIC" landing (biggest, highest-ticket
cluster), then item 5 (RU copy) so the hidden RU locale earns its keep.

## Data window & sources
- GSC: `https://trade-mua.vercel.app/`, 2026-03-02 → 2026-05-31 (3 impr / 1 click / 0 queries).
- Catalog: Supabase `products`, snapshot 2026-06-03.
- Code state: foundation reviewed 2026-06-03 (JSON-LD, hubs, sitemap, hreflang all present).
