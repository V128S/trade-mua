# SEO backlog — 2026-06-09

Full SEO pass for **trade-mua.vercel.app** (Next.js 16 App Router + Supabase, i18n uk/en/ru).

## Data window & sources
- **Catalog snapshot:** Supabase `products` — 62 rows, **1 in stock**, 8 algorithms, 6 brands, price $650–$30 800. `reviews` — 11 rows, avg rating 5.0.
- **Search Console:** ❌ **unavailable** — MCP returned `Authentication required for Google Search Console`. No real impressions/positions/CTR this pass.
- **Consequence:** `opportunity` scores below are inferred from on-page best practice + catalog, **not** real demand. Re-auth GSC to re-rank against actual queries (striking-distance, low-CTR).

## What's already solid (no action needed)
- Schema: `Product`+`Offer`+`Brand`+`additionalProperty`, `BreadcrumbList`, `FAQPage` (cards + services), `Organization`, `WebSite`, `ItemList` (hubs).
- hreflang `uk/en/ru/x-default`, `metadataBase`, self-canonical on ASIC hubs.
- Fully translated trilingual catalog (uk/en/ru, en.json is real English — the "EN not live" note is outdated).
- `robots.ts` blocks admin/dashboard/api/cart/checkout/auth; `sitemap.ts` covers static + 4 hubs + blog + all products.
- 4 algorithm hubs (sha256/scrypt/zcash/kaspa) with intro body + 6-FAQ + schema; per-model curated SEO copy + FAQ.
- CWV hygiene: self-hosted + preloaded icon font, GA deferred `lazyOnload`, fonts `display:swap`.

---

## Now — high value × low effort, broad reach

1. **Re-authenticate Google Search Console MCP** — value 5, opp 5, effort 1 → **priority 25**
   - evidence: `sites_list` → `Authentication required`. Everything downstream (real positions, CTR, cannibalization, quick wins) is blocked.
   - what to do: re-run the GSC OAuth setup (see memory `reference-gsc-ga4-mcp-setup`). User action — I can't do the OAuth.

2. **Add `shippingDetails` + `hasMerchantReturnPolicy` to product `Offer`** — value 4, opp 4, effort 2 → **priority 8**
   - evidence: `grep` shows neither present on any of 62 cards. Google "Merchant listings" flags these as missing → can suppress the price/availability rich result.
   - what to do: extend `offers` in `products/[slug]/page.tsx` (free Nova Poshta details / return window from real policy). Copy via `trademua-content-ua`.

3. **Upgrade `Organization` → add `address`, `telephone`, `contactPoint`, `sameAs`; consider `LocalBusiness` per office** — value 4, opp 4, effort 2 → **priority 8**
   - evidence: current `Organization` (layout.tsx) has only name/url/logo. Real offices exist in **Kyiv + Dnipro** (`contact/page.tsx`). No `sameAs`/phone anywhere.
   - what to do: enrich org JSON-LD with addresses + socials; targets local intent ("ASIC майнер Київ/Дніпро"). Localize per locale.

4. **Add self-referential `canonical` to `/products` and `/products/[slug]`** — value 3, opp 3, effort 1 → **priority 9**
   - evidence: their `generateMetadata` set only `alternates.languages`, no `alternates.canonical` (hubs do it right). Faceted filters can spawn duplicate query-param URLs with no canonical → index dilution.
   - what to do: add `alternates.canonical: \`${localePrefix}${path}\`` to both `generateMetadata`.

---

## Next — solid value, a bit more effort

5. **Insert algorithm hub into the product breadcrumb** (Home › Products › *SHA-256* › Model) — value 3, opp 3, effort 2 → priority 4.5
   - passes authority card→hub, strengthens the 4 hubs; mirror in visible breadcrumb + `BreadcrumbList`.

6. **Dedicated 1200×630 `opengraph-image`** (currently 640×640 `icon.png` for every page) — value 2, opp 3, effort 2 → priority 3. Social/Telegram CTR; use `opengraph-image.tsx` (next/og) per locale.

7. **`aggregateRating` from the 11 real 5.0 reviews** — value 3, opp 3, effort 2 → priority 4.5.
   - caveat: Google has restricted *self-serving* Organization-level stars in rich results — they may not render. Safe path: attach `Review`/`aggregateRating` only where reviews map to a specific product. Verify with `schema_validate` after GSC is back.

8. **`sitemap.ts`: add `lastModified`** (from `products.synced_at`, blog dates) — value 2, opp 2, effort 1 → priority 2. Faster recrawl of refreshed cards.

---

## Later — structural, higher effort

9. **Expand the hub layer** — value 3, opp 3, effort 4 → priority 2.25.
   - 8 algorithms exist, only 4 have hubs (no Ethash/Blake/etc.). Add the missing algo hubs + **brand hubs** (Antminer / Whatsminer / Avalon) and a use-case pillar (immersion / hydro). Each new indexable URL → `sitemap.ts`. Run via #structure + `trademua-feature-builder`.

10. **`WebSite` `potentialAction` SearchAction** (sitelinks search box) — value 2, opp 2, effort 1 → priority 2. Only fires on brand queries; low urgency.

11. **Catalog freshness — 61/62 products are "PreOrder" (1 in stock)** — *not strictly SEO* but commercial: thin in-stock inventory caps conversion on all the traffic the above earns. Flagging for the user; `availability: PreOrder` is honest and correct as-is.

---

## Highest-leverage action
**Re-auth GSC (#1)** unblocks real grounding; it's a user OAuth step. While that's pending, the fastest *code* win is bundling the **Now** schema/canonical quick wins (#2 Offer shipping/returns + #3 Organization local data + #4 canonicals) — all low-effort, touching every one of the 62 cards and the local pack at once.
