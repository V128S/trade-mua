# Performance Improvement Plan — trade-mua.vercel.app (desktop)

> **Status (updated 2026-05-31, after implementation):**
> - ✅ **P0 done & shipped to prod:** tsparticles lazy-loaded (dynamic import + `requestIdleCallback` + `prefers-reduced-motion` + lower density) in `background-sparkles.tsx`; font `preconnect` added in the locale layout.
> - ✅ **P1 framer-motion done & shipped:** the single spring animation (nav slide cursor) was replaced with a CSS transition and the dependency removed entirely.
> - ✅ **P1 client→server: already optimal** — `CryptoPriceTicker` is a server component with ISR (`revalidate:300`); no client-side fetches exist in public components; all data is server/ISR.
> - ✅ **P2 images: already optimal** — only `next/image` is used (no raw `<img>`), AVIF/WebP served automatically.
> - ⚠️ **OPEN — Material Symbols render-blocking font:** subsetting by `icon_names` is UNSAFE (many icons are referenced dynamically from data, e.g. `{s.icon}`/`{tab.icon}`/`{added?'check':...}`); the `onLoad` non-blocking trick doesn't work in RSC; moving to `next/font` risks breaking the variable icon font. Needs a careful, measured change.
> - ⏳ **Pending Lighthouse validation:** PSI API daily quota (429) blocked a fresh run; capture before/after when it resets or with a PSI key, then decide if Material Symbols / CLS tuning is worth the risk.
>
> Original analysis + plan follows.

> **Note:** Independent of i18n (targets the live/main site).
> **Note on numbers:** A fresh Lighthouse run was blocked at analysis time (PageSpeed Insights API `429 — daily quota exceeded` on the anonymous project; MCP rate-limited). The levers below are derived from the actual codebase/stack and standard Lighthouse findings for this setup. Re-run Lighthouse (with a PSI API key, or when quota resets) to capture exact before/after deltas. Reference report: https://pagespeed.web.dev/analysis/https-trade-mua-vercel-app/q7nxdrj9mv?form_factor=desktop

## Stack facts that drive performance

- `BackgroundSparkles` (tsparticles `@tsparticles/engine|react|slim` v4) renders on **every route** via `src/app/layout.tsx` — a fixed full-viewport `<canvas>` running a continuous `requestAnimationFrame` particle simulation (`particleDensity` 65 dark / 35 light). High main-thread cost (→ TBT / INP) + meaningful JS bundle on the critical path.
- `framer-motion` v12 — animation library; without `LazyMotion` the full feature bundle ships.
- **Material Symbols** icon font loaded via a render-blocking `<link>` in `<head>` with the full variable axis ranges (`opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200`) — render-blocking request + large font download for ~a dozen glyphs actually used.
- Three `next/font` families (Syne, Hanken Grotesk, JetBrains Mono) — self-hosted (good), but multiple families/weights add bytes.
- `CryptoPriceTicker` — client component with live data.
- GA4 via `@next/third-parties` — already deferred/non-blocking (good, keep).
- Product images via `next/image` (good).

---

## Prioritized actions (impact × effort)

### P0 — Biggest desktop wins, low risk

**1. Tame the particle background (`BackgroundSparkles`)** — likely the single largest TBT/INP + bundle win.
   - `src/app/layout.tsx`: load it via `next/dynamic` with `{ ssr: false }` so tsparticles is not in the initial/critical bundle.
   - Defer initialization until **after first idle** (`requestIdleCallback`) and **below the fold** — it is purely decorative (`pointer-events-none`, `aria-hidden`).
   - Reduce `particleDensity` substantially (e.g. 65 → ~20–25) — visually similar, far cheaper per frame.
   - Respect `prefers-reduced-motion`: render nothing when the user opts out.
   - Consider disabling entirely on small/low-power devices (it is a desktop ambiance effect).
   - **Expected:** large drop in Total Blocking Time and main-thread work; smaller initial JS.

**2. De-block Material Symbols** (`src/app/layout.tsx`).
   - Add `<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin>` (and `fonts.googleapis.com`).
   - Stop render-blocking: either load the stylesheet non-blocking (`media="print"` + `onload="this.media='all'"` pattern) **or**, better, **subset** to only the icons used via `&icon_names=<comma-list>` so the font payload shrinks dramatically.
   - **Best long-term:** replace the ~dozen icons with inline SVG and drop the icon font + its request entirely.
   - **Expected:** removes a render-blocking resource from the critical path → better FCP/LCP.

**3. Confirm and optimize the LCP element.**
   - Identify LCP on `/` (hero headline text vs. an image). If an image, ensure `priority` + correct `sizes`/dimensions; if text, ensure the headline font is not blocking (next/font `display: "swap"` is already set — good).
   - **Expected:** faster LCP.

### P1 — JS bundle / hydration

**4. Trim framer-motion.** Adopt `LazyMotion` + the lightweight `m` components with the `domAnimation` feature set instead of importing `motion` directly; lazy-load animation-heavy sections. **Expected:** smaller JS, less hydration cost.

**5. Reduce client JS / push work to the server.** Audit `"use client"` components that could be Server Components or ISR-fed (e.g. `CryptoPriceTicker` data could be fetched server-side with short `revalidate` instead of client-fetched). **Expected:** less client JS + fewer client fetches blocking interactivity.

**6. Code-split below-the-fold widgets** via `next/dynamic` (sparkles already in P0; apply to any other heavy, non-critical client components).

### P2 — Polish / stability

**7. CLS:** ensure every image/media and dynamic container has explicit dimensions (catalog cards, ticker, hero) so nothing shifts on load.
**8. Asset format:** confirm `next/image` is emitting AVIF/WebP and correct `sizes` for catalog/hero images.
**9. Keep third-parties lean:** GA already deferred; avoid adding more render-blocking third-party scripts.

---

## Measurement / verification

1. Capture a baseline **before** changes: `npx lighthouse https://trade-mua.vercel.app --preset=desktop --output=json --output-path=docs/seo/lh-baseline.json` (or PSI with an API key) — record Performance score, FCP, LCP, TBT, CLS, Speed Index.
2. Implement P0 first; deploy a preview; re-measure. P0 alone should move desktop Performance materially.
3. Then P1, re-measure; then P2.
4. **Target:** desktop Performance ≥ 90; TBT < 200 ms; LCP < 2.5 s; CLS < 0.1.

## Suggested sequencing
- **PR 1 (P0):** particle deferral/density + Material Symbols de-blocking + LCP check. Highest ROI, isolated.
- **PR 2 (P1):** framer-motion `LazyMotion` + client→server trims + dynamic imports.
- **PR 3 (P2):** CLS/image polish.

> Pairs naturally with the i18n work: do the P0 PR against `main` (or fold the `layout.tsx` particle/icon changes into the i18n layout migration, since that file is already being rewritten in `app/[locale]/layout.tsx`).
