# Blog expansion + fix — 2026-06-25

Workflow: #meta-content (blog cluster) + a critical structure fix. Data grounded in
the Supabase `products` catalog (catalog pull below). GSC signals were **not**
available — the `search-console` MCP returned "Authentication required" for every
property (`sc-domain:trade-mua.vercel.app`), so topics were grounded in catalog
strength + content-gap analysis against the existing cluster rather than live query
demand. Re-run the data-grounded prioritization once GSC auth is restored.

## Catalog snapshot used (Supabase `products`)

| Algorithm | Models | In stock | Price range (USDT) | Brands |
|---|---|---|---|---|
| SHA256 | 35 | 1 | 650–30 800 | AntMiner, Avalon, FluMiner |
| Scrypt | 14 | 0 | 888–6 900 | AntMiner, ElphaPex, FluMiner, VolcMiner |
| KHeavyHash | 4 | 0 | 1 800–2 300 | AntMiner |
| Equihash | 3 | 0 | 5 150–8 999 | AntMiner |
| VersaHash | 2 | 0 | 3 300–8 800 | Pinecone |
| RandomX / EthHash / X11 | 1 each | 0 | 1 800–6 550 | AntMiner, Pinecone |

SHA-256 is the backbone; strong Hydro/IMM flagship lineup (S23 Hyd 3U 1160 TH/s
@ $30 800) and a compact Avalon home line (Nano 3s 140 W, Mini 3, Avalon Q 90 TH/s).

## 🔴 Critical fix shipped

**3 articles from the previous commit were orphaned.** `asic-firmware-guide`,
`kaspa-mining-ukraine-2026`, and `litecoin-dogecoin-scrypt-mining-2026` existed on
disk (uk/ru/en) but were **missing from `BLOG_SLUGS`** in `src/lib/blog.ts`. Because
`getPost`/`getAllPosts` and `sitemap.ts` derive from that array, those posts:
returned 404 on `/blog/<slug>`, were absent from the `/blog` index, and were **not in
the sitemap** — i.e. zero crawlability for fresh content. All three are now registered.

## 4 new articles shipped (uk + ru + en each = 12 files)

Each anchors to a distinct hub/service and cross-links the cluster:

| Slug | Angle | Primary internal targets | Catalog grounding |
|---|---|---|---|
| `asic-cooling-air-hydro-immersion-2026` | Air vs Hydro vs Immersion cooling | `/asic/sha256`, `/services`, `/products` | S23 Hyd 3U, S21 XP Hyd, S23/S21XP IMM |
| `electricity-cost-mining-ukraine-2026` | UA tariffs, night metering, solar | `/calculator`, `/services` | S21 power/efficiency example |
| `home-mining-quiet-asic-2026` | Quiet/low-power home mining, heat reuse | `/asic/avalon` (was content-less), `/products` | Avalon Nano 3s, Mini 3, Avalon Q |
| `mining-pool-guide-2026` | PPS/FPPS/PPLNS, solo vs pool, ASIC setup | `/calculator`, cross-links BTC/Kaspa/Scrypt posts | algorithm→pool mapping |

Blog cluster grew from **6 → 13 published articles**. All articles use real model
specs, GFM tables, and locale-aware internal links (next-intl `Link` auto-prefixes
`/ru`). Verified: typecheck clean, 39/39 files parse via gray-matter, every internal
`/blog/*` and hub link resolves to a real route.

## What else to do (backlog — ranked)

1. **Restore GSC auth** and re-run `#backlog` with live data (`seo_striking_distance`,
   `seo_low_ctr_opportunities`, `analytics_top_queries`). Topic selection above was
   gap-driven, not demand-driven — confirm against real queries. *(blocker, low effort)*
2. **Give `/asic/avalon` an extended intro + FAQ** (`HUBS` `hasBody`/`faqCount`). The
   new home-mining article links to it but the hub itself is thin. Same likely for
   other brand hubs (fluminer, antminer). *(med effort, med value)*
3. **Blog index `lastModified` / ordering** — `getAllPosts` sorts by `date` desc; the
   3 newly-registered posts and 4 new ones all share 2026-06-25, so ordering among
   them is arbitrary. Consider a stable secondary sort (BLOG_SLUGS order). *(low)*
4. **BlogPosting/Article JSON-LD** — confirm each post emits Article schema with
   `datePublished`/`inLanguage`; add `BreadcrumbList` if missing. *(low, schema)*
5. **Internal links from hubs/products → these blog posts** (e.g. SHA-256 hub →
   cooling + electricity articles; calculator → electricity + pool guide). Currently
   links flow blog→hub but not hub→blog. *(med value)*
6. **Whatsminer gap** — CLAUDE.md positions Whatsminer as a core brand, but the
   catalog has none (AntMiner/Avalon/FluMiner only). Either sync Whatsminer SKUs or
   adjust brand messaging; affects any future Whatsminer content. *(needs product decision)*

## Backlog execution log (same day)

Worked the backlog 1→5. Two items turned out **already implemented** — verified
against code instead of trusting the backlog (which was written from assumptions):

1. **GSC re-auth — PENDING USER ACTION.** Token expired again (same as 2026-06-15).
   Prepared `/tmp/gsc-auth.sh` (pulls the custom OAuth client from `.mcp.json`, runs
   the patched copy's `setup --engine=google`). User must run it interactively
   (browser consent) + fully relaunch Claude Code, then the live-data re-prioritization
   can run. The analytical half of item 1 is blocked on this.
2. **Avalon hub — DONE (was already content-rich, not thin).** It already had
   `hasBody:true`+4 FAQ. Real fix shipped: refreshed `avalonBody`/`avalonDescription`
   to the actual catalog lineup (Avalon Q / Mini 3 / Nano 3s, not the absent A14/A15),
   added FAQ 5–6 on the home/compact angle, bumped `faqCount` 4→6. (uk/ru/en)
3. **Blog ordering + sitemap lastModified — DONE.** `getAllPosts` had an inconsistent
   comparator (returned −1 for equal dates → arbitrary order for the 7 same-day posts).
   Fixed with a stable tie-break by publishing order. Added `getBlogDates()` and wired
   `lastModified` onto blog sitemap entries (previously had none). Removed dead `dateMap`.
4. **BlogPosting/BreadcrumbList schema — DONE (was already present).** Post page already
   emitted full `BlogPosting` + `BreadcrumbList`. Added the recommended `image`
   (1200×630 OG route) to strengthen it.
5. **Hub/calculator → blog internal links — DONE.** Added a "Useful guides" section to
   every `/asic/*` hub (per-hub `relatedPosts` map) and to `/calculator`
   (tariff/payback/pool guides). New `guidesHeading` string in asicHub + calculator
   namespaces (uk/ru/en). This closes the one-directional blog→hub linking gap.

Verified: `npm run build` ✓ compiled, 134/134 static pages, blog/[slug] SSG with all
13 slugs × 3 locales; typecheck + lint clean.

## GSC-grounded re-prioritization (item 1, completed after re-auth)

Pulled live data (90d, both properties) once GSC auth was restored. **The data
overturns the "write more articles" premise** — the bottleneck is discovery, not content.

**Dominant finding — the whole site has 0 indexed pages.** Sitemap is healthy
(`https://xn--80aid2aql.com.ua/sitemap.xml`, 80 URLs, 0 errors, last downloaded
2026-06-24) but **indexed = 0**. A spot URL inspection returns "URL is unknown to
Google". традем.com.ua is a young domain with negligible authority; everything we've
shipped (articles, hub copy, schema, interlinking) is correct groundwork that can't
rank until pages get indexed.

**Real demand signal (tiny volume, but directionally clear):**
- Transactional model queries dominate: **Antminer Z15 Pro** (`antminer z15 купить`,
  `z15 цена`, `купить z15`, `bitmain antminer z15 цена`, … ~8 queries, pos 27–31) and
  **Antminer L7** (`antminer l7 цена`, `купить antminer l7`, … ~5 queries, pos 27–47).
- **Whatsminer M10** (`whatsminer m10`, `whatsminer m10 купить`) — real demand, **zero
  catalog coverage**.
- Brand `tradem` pos 3–5. striking_distance / low_ctr: empty (not enough volume).

**Verified the transactional pages are already well-optimized** — `/asic/zcash` title
= "Купити Antminer Z15 Pro — ASIC для Zcash", `/asic/scrypt` title = "Купити Antminer
L7, L9…"; Z15 ×24 / L7 ×22 mentions in the catalog. Page-3 positions reflect domain
age, **not** an on-page gap → no code fix to make here.

**Re-prioritized next actions (ranked, GSC-grounded):**
1. **Indexation nudge (highest leverage).** In the GSC UI, "Request indexing" for the
   ~10 key URLs (home, `/asic/zcash`, `/asic/scrypt`, Z15 Pro + L7 product cards, the
   7 newly-registered blog posts). API sitemap resubmit is blocked — the current OAuth
   token has **read-only** scope (`webmasters.readonly`); re-auth granting full
   `webmasters` if API submit is wanted. Sitemap auto-redownloads regardless.
2. **Whatsminer decision (only true gap in the data).** Sync Whatsminer SKUs → indexable
   product pages for live demand, or drop Whatsminer from positioning. Business/catalog
   call, not on-page.
3. **Off-site authority** (backlinks, brand mentions) — the real long-term lever for a
   new domain; outside the codebase.
4. Today's blog cluster + interlinking is the right topical-authority groundwork feeding
   1 & 3 over time. No further article production is the priority right now.

> Net: the codebase-side SEO is in good shape; the gating factor is now indexation +
> domain authority + the Whatsminer catalog decision — none of which is "write more".

## Files touched
- `src/lib/blog.ts` — `BLOG_SLUGS` 6 → 13 (3 orphan re-registrations + 4 new).
- `src/content/blog/{asic-cooling-air-hydro-immersion-2026,electricity-cost-mining-ukraine-2026,home-mining-quiet-asic-2026,mining-pool-guide-2026}.{uk,ru,en}.md` — 12 new files.
- Sitemap updates automatically (derives from `BLOG_SLUGS`).
