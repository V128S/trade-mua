# SEO backlog — TradeMua — 2026-05-31

## Data window & sources
- **Catalog** (Supabase `products`, live snapshot): 59 products, **only 1 in stock** (58 «під замовлення»), 8 algorithms, 6 brands, price $650–$32,000 (avg $4,402). Algorithm mix: SHA-256 ×33, Scrypt ×13, Equihash ×4, KHeavyHash ×4, VersaHash ×2, EthHash/RandomX/X11 ×1.
- **Google Search Console:** ❌ no verified property for this account (`sites_list` → empty). **There is no search data to score against.** Opportunity scoring (striking-distance, low-CTR, cannibalization) is **blind** until GSC is verified and accrues data.
- **GA4:** ✅ connected (property `539611389`), but the site was just deployed → ~no traffic yet.
- **Schema:** none on the site (no `application/ld+json`). Sitemap + robots: shipped today. Per-page localized metadata (UA+RU): shipped today.

> Because GSC is empty, this backlog is **foundation-first**: get measurement working + ship value that doesn't need rankings (schema, structure), then re-run with real data. Items whose value depends on unmeasured demand are labelled *speculative*.

---

## NOW — unblock measurement + ship rank-independent value

**1. Verify the site in Google Search Console & submit the sitemap.** ⛔ blocker
- value 5 · opportunity 5 · effort 1 → **priority 25**
- evidence: `sites_list` returns `[]` — no GSC property. Every data-driven step below is blind without this.
- do: add `trade-mua.vercel.app` as a GSC property (DNS or the existing GA4/`G-PFXVHGW9JT` tag can verify), submit `https://trade-mua.vercel.app/sitemap.xml`. *(User action in the GSC console — I can't do it for you.)* Then re-run this backlog in ~2–4 weeks with real queries.

**2. Add Product + Offer + BreadcrumbList JSON-LD to product pages.**
- value 4 · opportunity 4 · effort 2 → **priority 8**
- evidence: 59 product pages, zero structured data today; rich-result eligibility doesn't need rankings first.
- do: run **#schema** workflow → `references/schema-templates.md`. `availability` = `InStock` for the 1, `PreOrder` for the other 58 (matches reality). Build from live Supabase rows via a `JsonLd` server component (delegate to `trademua-feature-builder`). Validate with `schema_validate`.

**3. FAQPage schema on `/services`.**
- value 3 · opportunity 3 · effort 1 → **priority 9**
- evidence: the services page already renders a visible FAQ section (8 Q&A) — marking it up is near-free and FAQ-rich-results-eligible.
- do: #schema (FAQPage), UA+RU, mark up only the visible Q&A.

## NEXT — content & structure (some speculative until GSC data lands)

**4. Semantic core + meta/H1/FAQ for the SHA-256 / Bitcoin-miner cluster first.**
- value 4 · opportunity 3 *(speculative — SHA-256 is 56% of inventory, so highest commercial surface, but unconfirmed by GSC)* · effort 3 → **priority 4**
- do: #semantic-core (UA+RU) for SHA-256 models + an «SHA-256 / Bitcoin ASIC» hub; then #meta-content for the top-price in-demand models. Highest-ticket algos for margin: Equihash (avg $7,488), RandomX ($6,550), VersaHash ($6,050).

**5. Filter → indexable hub URLs + canonical strategy.**
- value 3 · opportunity 3 · effort 4 → **priority ~2**
- do: #structure — make `/products?algorithm=SHA-256` (and other high-inventory algos) crawlable hubs; `noindex` thin facet combos; internal-link hubs ↔ cards ↔ calculator; add hubs to `sitemap.ts`.

**6. Quality pass on the localized metadata we just shipped.**
- value 3 · opportunity 2 · effort 2 → **priority 3**
- do: #meta-content audit — confirm each page's title/description is intent-matched (not just present) in UA+RU; tighten the machine-translated RU.

## LATER — needs GSC data (revisit in ~2–4 weeks)

**7. Re-run #backlog with real Search Console data:** striking-distance (pos 8–15), low-CTR pages, cannibalization (category vs. card). All blind today.

**8. Out-of-stock dominance (58/59 «під замовлення»).** Decide with data whether thin pre-order cards should be enriched or temporarily de-prioritized/`noindex`. Don't act blind.

---

## The single highest-leverage action
**Verify Google Search Console and submit the sitemap (#1).** It's the cheapest item and it unblocks the entire opportunity-scoring half of SEO. Do it now; while data accrues, ship **#2 (Product/Offer schema)** since it delivers value before rankings exist. Say the word and I'll run the #schema workflow.
