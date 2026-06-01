# Glass-Gold-Crypto Refresh Implementation Plan (Phase 1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the Claude-Design "glass + gold + crypto" handoff into the live Next.js 16 site — shared design layer + full home-page restyle + targeted content changes — keeping the existing i18n, light theme, and our navbar/logo.

**Architecture:** Hand-written component classes + tokens in `src/app/globals.css` (mirrors the handoff's `trade.css` and the file's existing custom-class pattern), plus one client `GlassBackground` component carrying the network canvas, scroll-reveal observer, and glass mouse-glow (the handoff's `trade.js`, minus icons/ticker which the app already has). Dark theme is refreshed; `.light` token overrides stay intact so the toggle keeps working.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS 4 (`@theme`), next-intl, `next/font/google`.

**Branch:** `feat/glass-gold-refresh` (already created; spec committed).

**Verification note:** This is a visual port — most tasks verify with `npm run build`, `npm run lint`, and described manual checks rather than unit tests. The existing unit suite (`*.test.ts`) must keep passing and is run in the final task.

---

## Reference: design source (already extracted)

- CSS to port: `/tmp/trade-design/tradem/project/assets/trade.css`
- JS to port: `/tmp/trade-design/tradem/project/assets/trade.js`
- Home markup reference: `/tmp/trade-design/tradem/project/home.html`

If `/tmp/trade-design` is gone, re-extract: `tar -xzf <webfetch .bin> -C /tmp/trade-design` (the bundle is `tradem/`). The exact CSS/JS needed is reproduced inline in the tasks below, so the plan is self-contained even without the bundle.

---

## File structure

| File | Responsibility | Action |
|---|---|---|
| `src/app/[locale]/layout.tsx` | Font imports + html class + bg + swap BackgroundSparkles→GlassBackground + noscript reveal fallback | Modify |
| `src/app/globals.css` | Font-family tokens, dark palette, all glass-gold component classes, `.glass-nav` | Modify |
| `src/components/ui/GlassBackground.tsx` | Ambient/grain/network canvas + reveal observer + glass mouse-glow (client) | Create |
| `src/components/layout/Navbar.tsx` | Glass-nav background (keep structure) | Modify |
| `src/components/layout/CryptoPriceTicker.tsx` | Glass ticker styling | Modify |
| `src/messages/uk.json`, `src/messages/ru.json` | `home.heroTitle1` copy | Modify |
| `src/app/[locale]/page.tsx` | Home restyle + «Про нас» section | Modify |
| `src/components/products/ProductCard.tsx` | Glass card | Modify |
| `src/components/ui/BrandTicker.tsx` | Glass marquee | Modify |
| `src/components/ui/TrustBar.tsx` | Glass cards | Modify |
| `src/components/ui/HowItWorks.tsx` | Glass cards | Modify |
| `src/app/[locale]/contact/page.tsx` | Dnipro-only map | Modify |

---

## Task 1: Swap fonts to Unbounded / Manrope (Cyrillic) + repoint tokens

**Files:**
- Modify: `src/app/[locale]/layout.tsx:6`, `:44-46`, `:107`
- Modify: `src/app/globals.css:75-83`, `:142-143`

- [ ] **Step 1: Replace the font imports in `layout.tsx`**

Replace line 6:
```tsx
import { Syne, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
```
with:
```tsx
import { Unbounded, Manrope, JetBrains_Mono } from "next/font/google";
```

- [ ] **Step 2: Replace the font instances**

Replace lines 44-46:
```tsx
const syne = Syne({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-syne", display: "swap" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-hanken", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["500"], variable: "--font-jetbrains", display: "swap" });
```
with:
```tsx
const display = Unbounded({ subsets: ["latin", "cyrillic"], weight: ["600", "700", "800"], variable: "--font-display", display: "swap" });
const body = Manrope({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700", "800"], variable: "--font-body", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "700"], variable: "--font-mono", display: "swap" });
```

- [ ] **Step 3: Update the `<html>` className (line 107)**

Replace:
```tsx
    <html lang={locale} className={`dark ${syne.variable} ${hanken.variable} ${jetbrains.variable}`}>
```
with:
```tsx
    <html lang={locale} className={`dark ${display.variable} ${body.variable} ${mono.variable}`}>
```

- [ ] **Step 4: Repoint the font-family tokens in `globals.css`**

Replace lines 75-83:
```css
  /* Font families — reference CSS vars injected by next/font */
  --font-display-lg:       var(--font-syne), sans-serif;
  --font-headline-lg:      var(--font-syne), sans-serif;
  --font-headline-lg-mobile: var(--font-syne), sans-serif;
  --font-headline-md:      var(--font-syne), sans-serif;
  --font-body-lg:          var(--font-hanken), sans-serif;
  --font-body-md:          var(--font-hanken), sans-serif;
  --font-label-caps:       var(--font-hanken), sans-serif;
  --font-technical-data:   var(--font-hanken), sans-serif;
```
with:
```css
  /* Font families — reference CSS vars injected by next/font */
  --font-display-lg:       var(--font-display), sans-serif;
  --font-headline-lg:      var(--font-display), sans-serif;
  --font-headline-lg-mobile: var(--font-display), sans-serif;
  --font-headline-md:      var(--font-display), sans-serif;
  --font-body-lg:          var(--font-body), sans-serif;
  --font-body-md:          var(--font-body), sans-serif;
  --font-label-caps:       var(--font-body), sans-serif;
  --font-technical-data:   var(--font-body), sans-serif;
```

- [ ] **Step 5: Repoint the light-mode mono tokens (lines 142-143)**

Replace:
```css
  --font-label-md: var(--font-jetbrains), monospace;
  --font-label-sm: var(--font-jetbrains), monospace;
```
with:
```css
  --font-label-md: var(--font-mono), monospace;
  --font-label-sm: var(--font-mono), monospace;
```

- [ ] **Step 6: Verify the old var names are fully gone**

Run: `grep -rnE "font-syne|font-hanken|font-jetbrains" src/`
Expected: no matches.

- [ ] **Step 7: Build**

Run: `npm run build`
Expected: compiles successfully (fonts download at build time).

- [ ] **Step 8: Commit**

```bash
git add src/app/[locale]/layout.tsx src/app/globals.css
git commit -m "feat(design): swap to Unbounded/Manrope fonts with Cyrillic subset"
```

---

## Task 2: Dark palette → handoff values (#0b0b08)

**Files:**
- Modify: `src/app/globals.css:11-12`, `:24-25`, `:207`, `:312-313`

- [ ] **Step 1: Update dark background/surface tokens (lines 11-12)**

Replace:
```css
  --color-background:                #141410;
  --color-surface:                   #141410;
  --color-surface-dim:               #141410;
```
with:
```css
  --color-background:                #0b0b08;
  --color-surface:                   #121210;
  --color-surface-dim:               #0b0b08;
```

- [ ] **Step 2: Update dark text tokens (lines 24-25)**

Replace:
```css
  --color-on-surface:         #e5e2db;
  --color-on-surface-variant: #d1c5af;
```
with:
```css
  --color-on-surface:         #e9e5dc;
  --color-on-surface-variant: #b3aa92;
```

- [ ] **Step 3: Update dark `body` background (line 207)**

Replace:
```css
body {
  background-color: #111110;
```
with:
```css
body {
  background-color: #0b0b08;
```

- [ ] **Step 4: Update hero-fade overlay colors (lines 312-313)**

Replace:
```css
.hero-fade-top    { background: linear-gradient(to bottom, #111110 0%, transparent 100%); }
.hero-fade-bottom { background: linear-gradient(to top,   #111110 0%, transparent 100%); }
```
with:
```css
.hero-fade-top    { background: linear-gradient(to bottom, #0b0b08 0%, transparent 100%); }
.hero-fade-bottom { background: linear-gradient(to top,   #0b0b08 0%, transparent 100%); }
```

- [ ] **Step 5: Update the hardcoded body bg utility in `layout.tsx:131`**

Replace `bg-[#111110]` with `bg-[#0b0b08]` in the `<body className=...>`.

- [ ] **Step 6: Check for other stale dark-bg hardcodes**

Run: `grep -rnE "#141410|#111110" src/`
Expected: only intentional remaining references (review each; update any page/component using the old page background to `#0b0b08`).

- [ ] **Step 7: Build + commit**

```bash
npm run build
git add src/app/globals.css src/app/[locale]/layout.tsx
git commit -m "feat(design): darken dark-theme palette to #0b0b08 per handoff"
```

---

## Task 3: Add the glass-gold component classes to globals.css

**Files:**
- Modify: `src/app/globals.css` (append a new block before the final `select.catalog-sort` rules, i.e. at end of file)

- [ ] **Step 1: Append the glass-gold class block to the end of `globals.css`**

Add (verbatim — dark-tuned; `.coin`/`.coin-disc` intentionally omitted):
```css
/* ════════════════════════════════════════════════════════════════
   Glass & Gold refresh — ported design system (dark)
   ════════════════════════════════════════════════════════════════ */

/* Ambient gradient mesh + grain + network canvas (rendered by GlassBackground) */
.ambient {
  position: fixed; inset: 0; z-index: -3; pointer-events: none;
  background:
    radial-gradient(60vw 60vh at 82% -8%, rgba(236, 194, 70, 0.10), transparent 60%),
    radial-gradient(50vw 50vh at 8% 12%, rgba(201, 162, 39, 0.06), transparent 60%),
    radial-gradient(70vw 50vh at 50% 120%, rgba(236, 194, 70, 0.05), transparent 60%);
}
.light .ambient {
  background:
    radial-gradient(60vw 60vh at 82% -8%, rgba(117, 91, 0, 0.06), transparent 60%),
    radial-gradient(50vw 50vh at 8% 12%, rgba(117, 91, 0, 0.04), transparent 60%);
}
.grain {
  position: fixed; inset: 0; z-index: -2; pointer-events: none; opacity: 0.4;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
}
.light .grain { opacity: 0.18; }
canvas#net { position: fixed; inset: 0; z-index: -1; pointer-events: none; opacity: 0.55; }

/* Gold text sheen */
.gold-text {
  background: linear-gradient(120deg, #8a6d12 0%, #ecc246 32%, #fbf1c9 50%, #ecc246 68%, #8a6d12 100%);
  background-size: 200% 100%;
  -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: sheen 6s ease-in-out infinite;
}
@keyframes sheen { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }

/* Glass navigation */
.glass-nav {
  background: rgba(13, 13, 10, 0.55);
  backdrop-filter: blur(28px) saturate(160%);
  -webkit-backdrop-filter: blur(28px) saturate(160%);
  border-bottom: 1px solid rgba(236, 194, 70, 0.10);
  box-shadow: 0 1px 0 0 rgba(255,255,255,0.03) inset, 0 18px 40px -28px rgba(0,0,0,0.8);
}
.light .glass-nav {
  background: rgba(249, 249, 249, 0.65);
  backdrop-filter: blur(28px) saturate(140%);
  -webkit-backdrop-filter: blur(28px) saturate(140%);
  border-bottom: 1px solid rgba(117, 91, 0, 0.12);
  box-shadow: 0 18px 40px -28px rgba(117,91,0,0.15);
}

/* Glass card system */
.glass {
  position: relative;
  background: linear-gradient(160deg, rgba(40, 38, 30, 0.42), rgba(18, 18, 15, 0.30));
  backdrop-filter: blur(20px) saturate(140%);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  border: 1px solid rgba(236, 194, 70, 0.12);
  border-radius: 16px;
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.06), 0 24px 60px -32px rgba(0, 0, 0, 0.75);
  overflow: hidden;
  transition: border-color .45s cubic-bezier(.16,1,.3,1), transform .45s cubic-bezier(.16,1,.3,1), box-shadow .45s cubic-bezier(.16,1,.3,1);
}
.glass::before {
  content: ''; position: absolute; inset: -1px;
  background: radial-gradient(380px circle at var(--mx, -200px) var(--my, -200px), rgba(236,194,70,0.14), transparent 55%);
  opacity: 0; transition: opacity .5s ease; pointer-events: none;
}
.glass:hover::before { opacity: 1; }
.glass-hover:hover {
  border-color: rgba(236, 194, 70, 0.45);
  transform: translateY(-4px);
  box-shadow: inset 0 1px 0 0 rgba(255,255,255,0.08), 0 30px 70px -30px rgba(0,0,0,0.85), 0 0 36px -10px rgba(236,194,70,0.25);
}
.light .glass {
  background: linear-gradient(160deg, rgba(255,255,255,0.55), rgba(255,255,255,0.30));
  border: 1px solid rgba(117, 91, 0, 0.12);
  box-shadow: inset 0 1px 0 0 rgba(255,255,255,0.8), 0 24px 60px -32px rgba(117,91,0,0.10);
}

/* Hairline grid texture inside glass */
.grid-tex {
  position: absolute; inset: 0; pointer-events: none; opacity: 0.5;
  background-image:
    linear-gradient(rgba(236,194,70,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(236,194,70,0.05) 1px, transparent 1px);
  background-size: 34px 34px;
  -webkit-mask-image: radial-gradient(80% 80% at 50% 0%, #000, transparent);
  mask-image: radial-gradient(80% 80% at 50% 0%, #000, transparent);
}

/* Refreshed buttons (override the legacy .btn-primary/.btn-ghost above) */
.btn-primary {
  position: relative;
  background: linear-gradient(180deg, #f0d06a, #c9a227);
  color: #2a2003;
  box-shadow: inset 0 1px 0 0 #fbf1c9, 0 8px 24px -8px rgba(201,162,39,0.55);
  border-radius: 10px; overflow: hidden;
  transition: transform .2s, box-shadow .3s, filter .3s;
}
.btn-primary::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent);
  transform: translateX(-120%); transition: transform .6s ease;
}
.btn-primary:hover::after { transform: translateX(120%); }
.btn-primary:hover { transform: translateY(-2px); box-shadow: inset 0 1px 0 0 #fff, 0 12px 30px -8px rgba(236,194,70,0.6); filter: brightness(1.04); }
.btn-primary:active { transform: scale(.97); }

.btn-ghost {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(236,194,70,0.22);
  color: #e9e5dc; border-radius: 10px; backdrop-filter: blur(8px);
  transition: border-color .3s, color .3s, background-color .3s, transform .2s;
}
.btn-ghost:hover { border-color: #ecc246; color: #ecc246; background: rgba(236,194,70,0.06); transform: translateY(-2px); }
.btn-ghost:active { transform: scale(.97); }
.light .btn-ghost { background: rgba(255,255,255,0.4); border-color: rgba(117,91,0,0.3); color: #4d4635; }
.light .btn-ghost:hover { border-color: #755b00; color: #755b00; background: rgba(117,91,0,0.06); }

/* Pill chip (overrides legacy square .chip) */
.chip {
  border-radius: 999px;
  background: rgba(236,194,70,0.08);
  color: #ecc246;
  border: 1px solid rgba(236,194,70,0.25);
  backdrop-filter: blur(6px);
}
.light .chip { background: rgba(117,91,0,0.08); color: #755b00; border-color: rgba(117,91,0,0.25); }

/* Live pulse dot */
.pulse::before {
  content: ''; width: 7px; height: 7px; border-radius: 50%;
  background: #4ade80; box-shadow: 0 0 8px #4ade80;
  animation: pulse-dot 2s infinite cubic-bezier(.25,0,0,1);
}
.pulse.gold::before { background: #ecc246; box-shadow: 0 0 8px #ecc246; }
@keyframes pulse-dot {
  0% { transform: scale(.85); box-shadow: 0 0 0 0 rgba(74,222,128,.6); }
  70% { transform: scale(1.1); box-shadow: 0 0 0 7px rgba(74,222,128,0); }
  100% { transform: scale(.85); box-shadow: 0 0 0 0 rgba(74,222,128,0); }
}

/* Scroll reveal */
.reveal { opacity: 0; transform: translateY(28px); transition: opacity .9s cubic-bezier(.16,1,.3,1), transform .9s cubic-bezier(.16,1,.3,1); }
.reveal.in { opacity: 1; transform: none; }
.stagger > * { opacity: 0; transform: translateY(20px); transition: opacity .8s cubic-bezier(.16,1,.3,1), transform .8s cubic-bezier(.16,1,.3,1); }
.stagger.in > * { opacity: 1; transform: none; }
.stagger.in > *:nth-child(2) { transition-delay: .06s; }
.stagger.in > *:nth-child(3) { transition-delay: .12s; }
.stagger.in > *:nth-child(4) { transition-delay: .18s; }
.stagger.in > *:nth-child(5) { transition-delay: .24s; }
.stagger.in > *:nth-child(6) { transition-delay: .30s; }
.stagger.in > *:nth-child(7) { transition-delay: .36s; }
.stagger.in > *:nth-child(8) { transition-delay: .42s; }
@media (prefers-reduced-motion: reduce) {
  .reveal, .stagger > * { opacity: 1 !important; transform: none !important; }
  .gold-text { animation: none !important; }
}

/* Section heading rule */
.head-rule { display: flex; align-items: center; gap: 1rem; }
.head-rule .line { height: 1px; flex: 1; background: linear-gradient(90deg, transparent, rgba(236,194,70,0.30), transparent); }

/* Product image plate */
.plate { background: radial-gradient(120% 120% at 50% 0%, rgba(255,255,255,0.06), rgba(255,255,255,0.015)); }

/* Glass divider override stays compatible with existing .divider usage */
```

- [ ] **Step 2: Add the no-JS reveal fallback (so content is never hidden if the observer doesn't run)**

Append at the very end of `globals.css`:
```css
/* If JS is disabled, the IntersectionObserver never adds .in — force content visible. */
@media (scripting: none) {
  .reveal, .stagger > * { opacity: 1 !important; transform: none !important; }
}
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: compiles; no CSS parse errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(design): add glass-gold component classes (glass, gold-text, reveal, glass-nav)"
```

---

## Task 4: GlassBackground component (network canvas + reveal + glow)

**Files:**
- Create: `src/components/ui/GlassBackground.tsx`
- Modify: `src/app/[locale]/layout.tsx:12`, `:135`

- [ ] **Step 1: Create `src/components/ui/GlassBackground.tsx`**

```tsx
"use client";

import { useEffect } from "react";

// Ambient atmosphere for the glass-gold theme: gradient mesh + grain + a
// blockchain-node network canvas, plus the scroll-reveal observer and the
// .glass mouse-glow. Client-only, gated on prefers-reduced-motion. Replaces
// the old tsparticles BackgroundSparkles.
export default function GlassBackground() {
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    // ── Scroll reveal ──
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.06, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".reveal, .stagger").forEach((el) => io.observe(el));

    // ── Glass mouse-glow ──
    const onMove = (e: MouseEvent) => {
      document.querySelectorAll<HTMLElement>(".glass").forEach((c) => {
        const r = c.getBoundingClientRect();
        if (
          e.clientX > r.left - 60 && e.clientX < r.right + 60 &&
          e.clientY > r.top - 60 && e.clientY < r.bottom + 60
        ) {
          c.style.setProperty("--mx", e.clientX - r.left + "px");
          c.style.setProperty("--my", e.clientY - r.top + "px");
        }
      });
    };
    document.addEventListener("mousemove", onMove);

    // ── Network canvas ──
    let raf = 0;
    let cleanupNet = () => {};
    const cv = document.getElementById("net") as HTMLCanvasElement | null;
    if (cv && !reduce) {
      const cx = cv.getContext("2d")!;
      let parts: { x: number; y: number; vx: number; vy: number; s: number; o: number }[] = [];
      const mouse: { x: number | null; y: number | null } = { x: null, y: null };
      const onNetMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
      const onLeave = () => { mouse.x = mouse.y = null; };
      const init = () => {
        parts = [];
        const n = Math.min(70, Math.floor((innerWidth * innerHeight) / 22000));
        for (let i = 0; i < n; i++)
          parts.push({
            x: Math.random() * cv.width, y: Math.random() * cv.height,
            vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
            s: Math.random() * 1.4 + 0.5, o: Math.random() * 0.35 + 0.12,
          });
      };
      const size = () => { cv.width = innerWidth; cv.height = innerHeight; init(); };
      const loop = () => {
        cx.clearRect(0, 0, cv.width, cv.height);
        parts.forEach((p) => {
          if (mouse.x !== null && mouse.y !== null) {
            const dx = mouse.x - p.x, dy = mouse.y - p.y, dist = Math.hypot(dx, dy);
            if (dist < 150) { p.x += (dx / dist) * ((150 - dist) / 150) * 0.5; p.y += (dy / dist) * ((150 - dist) / 150) * 0.5; }
          }
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > cv.width) p.vx *= -1;
          if (p.y < 0 || p.y > cv.height) p.vy *= -1;
          cx.beginPath(); cx.arc(p.x, p.y, p.s, 0, 7); cx.fillStyle = `rgba(236,194,70,${p.o})`; cx.fill();
        });
        for (let a = 0; a < parts.length; a++)
          for (let b = a + 1; b < parts.length; b++) {
            const dx = parts[a].x - parts[b].x, dy = parts[a].y - parts[b].y, d = Math.hypot(dx, dy);
            if (d < 130) {
              cx.beginPath(); cx.moveTo(parts[a].x, parts[a].y); cx.lineTo(parts[b].x, parts[b].y);
              cx.strokeStyle = `rgba(236,194,70,${((130 - d) / 130) * 0.1})`; cx.lineWidth = 0.5; cx.stroke();
            }
          }
        raf = requestAnimationFrame(loop);
      };
      addEventListener("resize", size);
      addEventListener("mousemove", onNetMove);
      addEventListener("mouseleave", onLeave);
      size(); loop();
      cleanupNet = () => {
        removeEventListener("resize", size);
        removeEventListener("mousemove", onNetMove);
        removeEventListener("mouseleave", onLeave);
      };
    }

    return () => {
      io.disconnect();
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
      cleanupNet();
    };
  }, []);

  return (
    <>
      <div className="ambient" aria-hidden />
      <div className="grain" aria-hidden />
      <canvas id="net" aria-hidden />
    </>
  );
}
```

- [ ] **Step 2: Swap the import in `layout.tsx` (line 12)**

Replace:
```tsx
import BackgroundSparkles from "@/components/ui/background-sparkles";
```
with:
```tsx
import GlassBackground from "@/components/ui/GlassBackground";
```

- [ ] **Step 3: Swap the usage in `layout.tsx` (line ~135)**

Replace `<BackgroundSparkles />` with `<GlassBackground />`.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: compiles. (`background-sparkles.tsx` + `sparkles.tsx` are now unused but left in place; do not delete in this task.)

- [ ] **Step 5: Manual check**

Run: `npm run dev`, open `/`. Expected: faint gold gradient + grain + slow-moving gold dot network behind content; sections fade/slide in on scroll; hovering a glass card shows a gold radial glow following the cursor. With OS "reduce motion" on, the canvas is absent and content is fully visible.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/GlassBackground.tsx src/app/[locale]/layout.tsx
git commit -m "feat(design): GlassBackground (network canvas + scroll reveal + glass glow)"
```

---

## Task 5: Navbar — keep ours, add glass blur

**Files:**
- Modify: `src/components/layout/Navbar.tsx:211`

- [ ] **Step 1: Replace the `<nav>` className (line 211)**

Replace:
```tsx
    <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30">
```
with:
```tsx
    <nav className="glass-nav fixed top-0 w-full z-50">
```

(The `.glass-nav` class added in Task 3 supplies background blur + gold-hairline bottom border, and has a `.light` variant. Logo, auth menu, cart, toggles, and the mobile dropdown are unchanged.)

- [ ] **Step 2: Build + manual check**

Run: `npm run build`, then `npm run dev`. Expected: top bar shows a stronger frosted blur with a thin gold bottom hairline; `/logo.png` and all controls intact; toggling to light theme keeps the nav legible.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/Navbar.tsx
git commit -m "feat(design): glass-blur navbar (keep logo, auth, toggles, border)"
```

---

## Task 6: CryptoPriceTicker — glass styling

**Files:**
- Modify: `src/components/layout/CryptoPriceTicker.tsx:79`

- [ ] **Step 1: Replace the wrapper className (line 79)**

Replace:
```tsx
    <div className="w-full h-9 flex items-center select-none border-b border-card-border overflow-hidden">
```
with:
```tsx
    <div className="w-full h-9 flex items-center select-none overflow-hidden border-b border-[rgba(236,194,70,0.12)] bg-gradient-to-b from-[rgba(18,18,15,0.92)] to-[rgba(11,11,8,0.92)] backdrop-blur-md">
```

- [ ] **Step 2: Build + commit**

```bash
npm run build
git add src/components/layout/CryptoPriceTicker.tsx
git commit -m "feat(design): glass styling for crypto price ticker"
```

---

## Task 7: Home hero copy + restyle

**Files:**
- Modify: `src/messages/uk.json:54`, `src/messages/ru.json:54`
- Modify: `src/app/[locale]/page.tsx:115-152`

- [ ] **Step 1: Update `home.heroTitle1` in `uk.json` (line 54)**

Replace `"heroTitle1": "Вигідні",` with `"heroTitle1": "Промислові та домашні",`.

- [ ] **Step 2: Update `home.heroTitle1` in `ru.json` (line 54)**

Replace `"heroTitle1": "Выгодные",` with `"heroTitle1": "Промышленные и домашние",`.

- [ ] **Step 3: Restyle the hero headline + stats in `page.tsx`**

Replace the headline block (lines 115-120):
```tsx
              <h1 className="font-display-lg text-display-lg text-on-surface uppercase leading-none">
                {t("heroTitle1")}{" "}
                <span className="text-primary">ASIC</span>
                <br />
                {t("heroTitle2")}
              </h1>
```
with:
```tsx
              <h1 className="font-display-lg text-display-lg text-on-surface uppercase leading-none">
                {t("heroTitle1")}{" "}
                <span className="gold-text">ASIC</span>
                <br />
                {t("heroTitle2")}
              </h1>
```

Then replace the trust-stats values block (lines 144-150) so the numbers use the gold sheen — replace:
```tsx
                    <div className="font-headline-md text-headline-md text-primary">{s.value}</div>
```
with:
```tsx
                    <div className="font-headline-md text-headline-md gold-text">{s.value}</div>
```

- [ ] **Step 4: Mark the hero for immediate reveal & section animations (optional polish)**

In `page.tsx`, on the outer hero `<section>` (line 86) append ` stagger in` is NOT needed (hero is above the fold). Leave hero un-`reveal`ed so it shows instantly. (No code change — this step is a documented decision.)

- [ ] **Step 5: Build + manual check**

Run: `npm run build`, `npm run dev`, open `/`. Expected: hero reads "Промислові та домашні ASIC Майнери", "ASIC" has the animated gold sheen; stat numbers shimmer gold; switch locale to `/ru` → "Промышленные и домашние ASIC Майнеры".

- [ ] **Step 6: Commit**

```bash
git add src/messages/uk.json src/messages/ru.json src/app/[locale]/page.tsx
git commit -m "feat(design): hero copy 'Промислові та домашні' + gold sheen on ASIC/stats"
```

---

## Task 8: Home section cards → glass-gold

**Files:**
- Modify: `src/app/[locale]/page.tsx` (section headings, services flip, calc CTA, stats, testimonials)
- Modify: `src/components/products/ProductCard.tsx:30-126`
- Modify: `src/components/ui/BrandTicker.tsx:19`
- Modify: `src/components/ui/TrustBar.tsx:18-27`
- Modify: `src/components/ui/HowItWorks.tsx:18-22`

- [ ] **Step 1: ProductCard → glass card (`ProductCard.tsx`)**

Replace the root `<Link>` className (line 31-32):
```tsx
      className="group bg-card border-card rounded-lg overflow-hidden hover-primary-border transition-colors duration-300 flex flex-col"
```
with:
```tsx
      className="glass glass-hover group overflow-hidden flex flex-col"
```
Replace the image wrapper (line 34):
```tsx
      <div className="relative h-44 bg-white flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/30" />
```
with:
```tsx
      <div className="relative h-44 plate flex items-center justify-center overflow-hidden border-b border-white/5">
        <div className="grid-tex" />
```
Replace the price span (line 114):
```tsx
            <span className="font-headline-md text-headline-md text-primary">
```
with:
```tsx
            <span className="font-headline-md text-headline-md gold-text">
```

- [ ] **Step 2: BrandTicker → glass marquee (`BrandTicker.tsx` line 19)**

Replace:
```tsx
    <div className="w-full border-y border-card-border overflow-hidden bg-card/60 py-5 select-none">
```
with:
```tsx
    <div className="glass marquee w-full overflow-hidden py-5 select-none !rounded-2xl">
```

- [ ] **Step 3: TrustBar → glass cards (`TrustBar.tsx`)**

Replace the grid wrapper (lines 18-22):
```tsx
    <div
      className={`grid grid-cols-2 lg:grid-cols-4 gap-px bg-card-border border-card rounded-lg overflow-hidden ${
        compact ? "" : ""
      }`}
    >
```
with:
```tsx
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-gutter">
```
Replace each item wrapper (lines 24-27):
```tsx
        <div
          key={item.title}
          className={`bg-card flex flex-col items-center text-center ${compact ? "gap-2.5 p-4" : "gap-3 p-5 sm:p-6"}`}
        >
```
with:
```tsx
        <div
          key={item.title}
          className={`glass glass-hover flex flex-col items-center text-center ${compact ? "gap-2.5 p-4" : "gap-3 p-5 sm:p-6"}`}
        >
```

- [ ] **Step 4: HowItWorks → glass cards (`HowItWorks.tsx` lines 20-22)**

Replace:
```tsx
          className="bg-card border-card rounded-lg p-6 flex flex-col gap-3 hover-primary-border transition-colors duration-300"
```
with:
```tsx
          className="glass glass-hover p-6 flex flex-col gap-3"
```

- [ ] **Step 5: Home section headings → `head-rule` (`page.tsx`)**

For each of the 4 section headings that use the `flex items-center gap-4 mb-10` + two `h-px ... flex-1` divider pattern (top products line ~177, services line ~207, how-it-works line ~248, testimonials line ~315), replace the divider `<div className="h-px bg-outline-variant flex-1" />` pair + heading with the `head-rule` pattern. Concretely, replace each occurrence of:
```tsx
        <div className="flex items-center gap-4 mb-10">
          <div className="h-px bg-outline-variant flex-1" />
          <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest whitespace-nowrap">
```
with:
```tsx
        <div className="head-rule mb-10">
          <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest whitespace-nowrap">
```
and replace the closing divider line `<div className="h-px bg-outline-variant flex-1" />` (the one AFTER the `</h2>`) with `<div className="line" />`. Do this for all four headings. (The leading divider is removed; `head-rule` draws the trailing gold line.)

- [ ] **Step 6: Services flip cards → glass faces (`page.tsx` lines 221, 228)**

Replace front face (line 221):
```tsx
                <div className="service-flip-face bg-card border border-card-border rounded-lg px-8 pt-8 pb-10 h-full flex flex-col items-center text-center gap-4 cursor-default">
```
with:
```tsx
                <div className="service-flip-face glass px-8 pt-8 pb-10 h-full flex flex-col items-center text-center gap-4 cursor-default">
```
Replace back face (line 228):
```tsx
                <div className="service-flip-face service-flip-back bg-card border border-primary/30 rounded-lg p-8 flex flex-col items-center justify-center gap-6 text-center">
```
with:
```tsx
                <div className="service-flip-face service-flip-back glass p-8 flex flex-col items-center justify-center gap-6 text-center" style={{ borderColor: "rgba(236,194,70,0.3)" }}>
```

- [ ] **Step 7: Calculator-CTA + Achievements panels → glass (`page.tsx` lines 260, 288)**

Replace both occurrences of:
```tsx
        <div className="bg-card border-card rounded-lg p-8 md:p-12 relative overflow-hidden">
```
with:
```tsx
        <div className="glass p-8 md:p-12 relative overflow-hidden">
```
In the achievements grid, the stat numbers already use `text-primary`; replace `text-primary` with `gold-text` on the achievements stat `<div className="font-display-lg text-[40px] md:text-[52px] leading-none text-primary">` (line ~301) → `gold-text`.

- [ ] **Step 8: Testimonial cards → glass (`page.tsx` line 325)**

Replace:
```tsx
            <div key={testimonial.name} className="group bg-card border border-card-border rounded-lg p-6 flex flex-col gap-4 cursor-default">
```
with:
```tsx
            <div key={testimonial.name} className="glass glass-hover group p-6 flex flex-col gap-4 cursor-default">
```

- [ ] **Step 9: Build + lint + manual check**

Run: `npm run build && npm run lint`
Expected: clean. `npm run dev` → all home sections are frosted-glass cards with gold-hairline borders, hover-lift + cursor glow; prices/stat numbers shimmer gold; section headings show a single trailing gold rule.

- [ ] **Step 10: Commit**

```bash
git add src/app/[locale]/page.tsx src/components/products/ProductCard.tsx src/components/ui/BrandTicker.tsx src/components/ui/TrustBar.tsx src/components/ui/HowItWorks.tsx
git commit -m "feat(design): glass-gold cards across home (products, trust, services, steps, stats, reviews)"
```

---

## Task 9: «Про нас» section on home

**Files:**
- Modify: `src/app/[locale]/page.tsx` (add a section + use the `about` namespace)

- [ ] **Step 1: Load the `about` translations in `Home` (`page.tsx` after line 27)**

After `const tHiw = await getTranslations("howItWorks");` add:
```tsx
  const tAbout = await getTranslations("about");
  const ABOUT_VALUES = [
    { icon: "verified", title: tAbout("value1Title"), desc: tAbout("value1Desc") },
    { icon: "speed", title: tAbout("value2Title"), desc: tAbout("value2Desc") },
    { icon: "support_agent", title: tAbout("value3Title"), desc: tAbout("value3Desc") },
    { icon: "lock", title: tAbout("value4Title"), desc: tAbout("value4Desc") },
  ];
```

- [ ] **Step 2: Insert the «Про нас» section after the Services section**

Immediately after the closing `</section>` of the Services block (line ~244, before the "How it works" section), insert:
```tsx
      {/* ── Про нас ── */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mt-section-gap reveal">
        <div className="head-rule mb-10">
          <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest whitespace-nowrap">
            {t("aboutHeading")}
          </h2>
          <div className="line" />
        </div>
        <div className="glass p-8 md:p-12 relative overflow-hidden">
          <div className="grid-tex" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 items-center">
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
              {tAbout("heroBody")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-gutter">
              {ABOUT_VALUES.map((v) => (
                <div key={v.title} className="flex gap-4">
                  <span className="material-symbols-outlined text-primary text-[24px] shrink-0 mt-0.5">{v.icon}</span>
                  <div>
                    <h3 className="font-technical-data text-technical-data text-on-surface leading-tight">{v.title}</h3>
                    <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mt-1.5 leading-snug">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
```

- [ ] **Step 3: Add the `aboutHeading` key to the `home` namespace**

The section heading uses `t("aboutHeading")` from the `home` namespace. Add `"aboutHeading": "Про нас",` to the `home` block in `uk.json` (after `heroLabel`, line ~53) and `"aboutHeading": "О нас",` to the `home` block in `ru.json` (after line ~53).

- [ ] **Step 4: Build + manual check**

Run: `npm run build`, `npm run dev`, open `/`. Expected: a «Про нас» glass section appears after Services — company story on the left, the 4 principles on the right; renders in both `uk` and `ru`. Verify the icons (`speed`, `support_agent`) are present in `MATERIAL_SYMBOLS_ICONS` in `layout.tsx` (they are — confirm by `grep`).

- [ ] **Step 5: Commit**

```bash
git add src/app/[locale]/page.tsx src/messages/uk.json src/messages/ru.json
git commit -m "feat(design): add «Про нас» section to home (reuses about namespace)"
```

---

## Task 10: Contact page — Dnipro-only map

**Files:**
- Modify: `src/app/[locale]/contact/page.tsx:199-232`

- [ ] **Step 1: Render the map iframe only for the Dnipro office**

In the offices grid, each office object has a `mapQuery`. Add a `hasMap` flag and gate the iframe. Replace the array (lines 200-202):
```tsx
          {[
            { city: t("office1City"), desc: t("office1Desc"), address: t("office1Address"), mapQuery: "Butyshiv Ln 19, Kyiv, 01010" },
            { city: t("office2City"), desc: t("office2Desc"), address: t("office2Address"), mapQuery: "Kosmichna St 19, Dnipro, 49000" },
          ].map((o) => (
```
with:
```tsx
          {[
            { city: t("office1City"), desc: t("office1Desc"), address: t("office1Address"), mapQuery: "Butyshiv Ln 19, Kyiv, 01010", hasMap: false },
            { city: t("office2City"), desc: t("office2Desc"), address: t("office2Address"), mapQuery: "Kosmichna St 19, Dnipro, 49000", hasMap: true },
          ].map((o) => (
```

- [ ] **Step 2: Gate the iframe (lines 222-229)**

Replace:
```tsx
              <iframe
                src={`https://www.google.com/maps?q=${encodeURIComponent(o.mapQuery)}&hl=uk&output=embed`}
                title={`${o.city} — ${o.address}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-56 border-0 grayscale-[0.3] contrast-[1.1] mt-auto"
                allowFullScreen
              />
```
with:
```tsx
              {o.hasMap && (
                <iframe
                  src={`https://www.google.com/maps?q=${encodeURIComponent(o.mapQuery)}&hl=uk&output=embed`}
                  title={`${o.city} — ${o.address}`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-56 border-0 grayscale-[0.3] contrast-[1.1] mt-auto"
                  allowFullScreen
                />
              )}
```

- [ ] **Step 3: Build + manual check**

Run: `npm run build`, `npm run dev`, open `/contact`. Expected: only the **Dnipro** office card shows an embedded map (real address `Kosmichna St 19`); the Kyiv card keeps its address + "directions" link but no embedded map.

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/contact/page.tsx
git commit -m "feat(design): contact page shows map for Dnipro office only"
```

---

## Task 11: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Full build**

Run: `npm run build`
Expected: success, no type errors, all routes build.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no errors. (If `background-sparkles.tsx`/`sparkles.tsx` trigger unused-file warnings, ignore — they're left for a possible future use; lint operates on imports, not orphan files.)

- [ ] **Step 3: Unit tests**

Run: `npm test` (or the project's test script, e.g. `vitest run`)
Expected: existing `*.test.ts` suites pass (i18n routing, cart math/reducer, auth routing).

- [ ] **Step 4: Manual smoke (dark)**

`npm run dev`, dark theme: home shows glass-gold cards, gold sheen on ASIC/prices/stats, network background, «Про нас» section; Cyrillic renders in Unbounded/Manrope (inspect a heading's `font-family` in devtools — not a system fallback); no floating ₿ coins anywhere; navbar keeps `/logo.png` + glass blur + gold bottom hairline; `/contact` shows Dnipro-only map.

- [ ] **Step 5: Manual smoke (light + reduced-motion)**

Toggle light theme: site remains usable/legible (not yet redesigned — expected). Enable OS reduce-motion: no canvas animation, no sheen, content fully visible. Disable JS: content still visible (no hidden `.reveal` blocks).

- [ ] **Step 6: Final commit (if any tweaks) & summary**

```bash
git add -A
git commit -m "chore(design): phase-1 glass-gold refresh verification fixes" --allow-empty
```

Report results (build/lint/test output) to the user. Do NOT merge — leave on `feat/glass-gold-refresh` for review.

---

## Self-review notes (author)

- **Spec coverage:** tokens (T2), fonts (T1), shared glass layer (T3) + runtime (T4), navbar glass (T5), ticker (T6), hero copy + sheen (T7), home cards + About (T8, T9), Dnipro map (T10), light-theme-preserved + reduced-motion + no-coins (verified T11). All spec items mapped.
- **Industrial Excellence:** confirmed absent in code; no task needed beyond "don't introduce" — covered by reusing existing neutral copy.
- **Type/name consistency:** new CSS class names (`glass`, `glass-hover`, `glass-nav`, `gold-text`, `head-rule`, `line`, `grid-tex`, `plate`, `ambient`, `grain`, `reveal`, `stagger`) defined in T3 and used consistently in T4-T9. Component is `GlassBackground` throughout. Font CSS vars `--font-display/-body/-mono` defined in T1 and referenced in T1 token repoint only.
- **Light theme:** `.light` token block untouched; `.light` variants added for `.glass`, `.glass-nav`, `.btn-ghost`, `.chip`, `.ambient`, `.grain` so the toggle stays usable pending the Phase-2 light redesign.
