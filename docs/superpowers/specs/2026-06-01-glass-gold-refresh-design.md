# Glass-Gold-Crypto Refresh — Design Spec (Phase 1)

_Date: 2026-06-01 · Branch: feat/glass-gold-refresh_

## Source

Design handoff from Claude Design (`claude.ai/design`), bundle `tradem/`:
- Primary file: `Trade-M-Refresh.html` (product page); shared system in `assets/trade.css` + `assets/trade.js` + `assets/trade-tw.js`; pages `home.html`, `catalog.html`, `services.html`, `calculator.html`, `contact.html`.
- Direction (from `chats/chat1.md`): make the existing dark "Industrial" look **more modern, airy, glass + gold**, add crypto/Bitcoin atmosphere and animation, and **fix Cyrillic fonts** (current Syne + Hanken Grotesk ship no Cyrillic glyphs, so Ukrainian/Russian silently falls back to system fonts).

The handoff is **standalone HTML prototypes** (Tailwind CDN + vanilla JS). This spec ports the *visual output* into the real Next.js 16 + Tailwind 4 + next-intl codebase — matching the look, not the prototype's internal structure.

## Goal

Phase 1: port the shared glass-gold-crypto design system + fully restyle the **home page**, plus a set of targeted content changes. Other public pages (catalog, services, calculator, contact, product detail) inherit the shared layer immediately and get full per-page restyles in Phase 2.

## Decisions (confirmed with user)

| # | Decision |
|---|---|
| Scope | Shared glass-gold layer + **full home restyle** now. Other pages inherit the layer; full restyles deferred to Phase 2. |
| Light theme | **Keep it working.** Refresh applies to the dark theme; light `.light` token overrides stay intact so the toggle keeps functioning. Light is visually adapted to the new design in a later phase. |
| Fonts | **Swap globally** Syne→Unbounded (display), Hanken Grotesk→Manrope (body); JetBrains Mono stays. All with `cyrillic` subset. |
| Navbar | **Keep our `Navbar` component** (logo `/logo.png`, auth menu, cart, theme/lang toggles, bottom border). Only change: lighter **glass blur** background + gold-hairline bottom border. Do NOT adopt the handoff's glass nav. |
| Logo | Keep `/logo.png` everywhere. Do NOT use the handoff's `₿` mark. |
| Floating coins | **Removed.** Do NOT port `.coin` ₿ glyphs or the rotating `coin-disc`. The abstract gold-dot network canvas (`#net`) is kept as background atmosphere. |
| Industrial Excellence | Already absent from the live codebase (only in handoff HTML). Requirement satisfied by simply not introducing it. |
| "Про нас" | New glass **About section on the home page**, reusing the existing `about` i18n namespace. |
| Dnipro map | Google Maps embed on the **contact page**, Dnipro office only. Pin = handoff placeholder `просп. Дмитра Яворницького, 22, Дніпро`. |

## Architecture / approach

Port the handoff's plain CSS classes into `src/app/globals.css` (which already mixes `@theme` tokens with hand-written component classes like `.btn-primary`, `.glass-card`, `.service-flip`). Port the runtime (network canvas, scroll-reveal, glass mouse-glow) into a small client component. Rationale: lowest churn, keeps our token system + type scale, mirrors the handoff's own structure, avoids a second styling source of truth.

### Current → target map

- `[locale]` i18n (uk/ru), next-intl; all copy via `t()` keys in `src/messages/{uk,ru}.json`.
- Home `src/app/[locale]/page.tsx` already maps section-for-section to `home.html` (hero + carousel, brand ticker, trust bar, product grid, services, how-it-works, calculator CTA, stats, testimonials). This is a **visual uplift of the same structure**, not a rebuild.
- Reused components: `HeroCarousel`, `BrandTicker`, `TrustBar`, `HowItWorks`, `ProductCard`, `CryptoPriceTicker`, `Navbar`, `Footer`.

## Work items

### 1. Tokens & palette — `globals.css @theme` (dark only)
- `--color-background` / `--color-surface`: `#141410` → `#0b0b08`.
- `body` background `#111110` → `#0b0b08` (dark only; `.light body` unchanged).
- `--color-on-surface`: `#e5e2db` → `#e9e5dc`; `--color-on-surface-variant`: `#d1c5af` → `#b3aa92`.
- Gold tokens unchanged (`#ecc246` / `#c9a227` / champagne `#f5e1ab`).
- `.hero-fade-top/bottom` gradients updated to `#0b0b08`.
- `.light` token block: **untouched.**

### 2. Fonts — `layout.tsx` + `globals.css`
- `layout.tsx`: replace `Syne`→`Unbounded` (weights 600/700/800), `Hanken_Grotesk`→`Manrope` (400/500/600/700/800); keep `JetBrains_Mono`. Add `cyrillic` to each `subsets`. Rename CSS vars to `--font-display`, `--font-body`, `--font-mono`; update `<html className>`.
- `globals.css`: repoint the `--font-display-*` / `--font-headline-*` / `--font-body-*` / `--font-label-*` / `--font-technical-data` family tokens to the new vars.
- Verify `MATERIAL_SYMBOLS_ICONS` still covers all icons used after the home restyle (add any new ones).

### 3. Shared glass-gold layer — `globals.css` + new `GlassBackground` component
- Port to `globals.css` (dark-tuned): `.glass` + `.glass::before` mouse-glow + `.glass-hover`; `.grid-tex`; `.gold-text` (sheen, `@keyframes sheen`); refreshed `.btn-primary` (gradient + sweep) and `.btn-ghost`; pill `.chip`; `.pulse`; `.reveal` + `.stagger` (+ `prefers-reduced-motion` guard); `.head-rule`; `.plate`; `.divider`; gold range thumb; `.marquee` + `@keyframes ticker`.
- New `src/components/ui/GlassBackground.tsx` (client): renders `.ambient` mesh + `.grain` + `<canvas id="net">`; runs the blockchain-node network animation, the reveal `IntersectionObserver`, and the `.glass` mouse-glow listener. **Replaces `BackgroundSparkles`** in `layout.tsx`.
- **No** `.coin` glyphs, **no** `coin-disc`.
- Respect `prefers-reduced-motion` (skip canvas + sheen + reveal transforms).

### 4. Navbar — keep ours, add light glass — `Navbar.tsx`
- Replace `bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30` with the glass-nav treatment: `background: rgba(13,13,10,0.55)`, `backdrop-filter: blur(28px) saturate(160%)`, gold-hairline bottom border. Add a `.glass-nav` class (+ `.light .glass-nav` variant) in `globals.css`.
- Everything else (logo, `SlideNav`, auth menu, cart, toggles, mobile dropdown) unchanged.
- `CryptoPriceTicker`: restyle to the glass ticker look (keep placement + behavior). Halving-countdown addition is **out of scope** for Phase 1.

### 5. Home restyle — `page.tsx`
Apply glass-gold per section, structure unchanged:
- **Hero:** eyebrow uses `heroLabel`; headline `{heroTitle1} ASIC <br> {heroTitle2}` with `gold-text` sheen on `ASIC`; refreshed buttons; stat numbers → `gold-text`.
- **Brand ticker / trust / product grid / services / steps / stats / testimonials:** glass cards (`.glass .glass-hover`) with hover-lift + mouse-glow; `head-rule` headings; `gold-text` on prices + stat values; `.grid-tex` texture inside feature panels.
- Service cards: keep the existing flip behavior but on glass surfaces (or switch to the handoff's static glass service cards — implementer's call, must stay visually consistent; default: keep flip on glass).

### 6. Content changes
- **Hero headline** (`home.heroTitle1`): `Вигідні` → **`Промислові та домашні`** (uk) / **`Промышленные и домашние`** (ru). `heroTitle2` (`Майнери`/`Майнеры`) unchanged. Net hero reads "Промислові та домашні ASIC Майнери".
- **Industrial Excellence:** none present — ensure none is introduced (footer tagline, meta stay neutral / current).
- **«Про нас» home section:** new glass section (placed after Services), reusing `about` namespace — `heroBody` (story), the 4 `valueN` principles, the 4 `statN` stat pairs. Heading "Про нас". Optional "Докладніше" link reserved for a future `/about` page (not built in Phase 1).
- **Dnipro map** (`contact/page.tsx`): add a responsive Google Maps `<iframe>` embed (lazy-loaded) for the Dnipro office only, styled to sit in a glass/bordered frame. Pin address = `просп. Дмитра Яворницького, 22, Дніпро`.

## Out of scope (Phase 2+)
- Full restyle of catalog, services, calculator, contact, product-detail pages (they inherit the shared layer in Phase 1 but aren't individually polished).
- Visual adaptation of the **light** theme to the new design.
- Halving-countdown widget; standalone `/about` page; dashboard/admin/auth screen restyles.

## Testing / verification
- `npm run build` + `npm run lint` clean.
- Manual: home renders in dark with glass cards, gold sheen, network background, new fonts rendering Cyrillic (no system-font fallback); reduced-motion disables animation; light-theme toggle still works (site usable, not yet redesigned); no `.coin` glyphs; navbar keeps logo + bottom border with glass blur; About section visible on home; Dnipro map embeds on contact page.
- Existing unit tests (`*.test.ts`) still pass.

## Risks
- Font swap affects the entire site (admin/dashboard included) — verify no layout breakage from Unbounded's wider metrics.
- Changing dark background `#141410`→`#0b0b08` may expose hardcoded `#141410`/`#111110` references — grep and update.
- `GlassBackground` canvas must not regress performance/CLS; gate on `prefers-reduced-motion` and keep particle count capped (≤70, as in handoff).
