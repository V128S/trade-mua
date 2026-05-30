# i18n (UA + RU) — Design Spec

> **Status:** Approved design. Next step: implementation plan (`writing-plans`).
> **Scope:** Add Russian as a real on-site language alongside Ukrainian, using `next-intl` on Next.js 16 App Router. This is the first of two sub-projects; the second (`asic-seo-specialist` skill) is deferred until this ships.

**Goal:** Make the site bilingual — Ukrainian (default) and Russian — for the public UI and static copy, with correct multilingual SEO, without breaking existing indexed Ukrainian URLs.

**Tech stack:** Next.js 16 (App Router) + React 19, `next-intl` for messages/routing/metadata, existing Tailwind/design system unchanged.

---

## Decisions (from brainstorming)

| Topic | Decision |
|---|---|
| Library | `next-intl` (App Router standard; `next-i18next` is deprecated for App Router) |
| Locales | `uk` (default), `ru` |
| URL strategy | `localePrefix: 'as-needed'` — UA at root (`/products`), RU at `/ru/products`. Existing UA URLs unchanged. |
| Translation scope | Public UI + static copy only. Catalog data (names, specs, prices) stays as-is (language-neutral). |
| Out of scope | Dynamic product descriptions, `/dashboard` + `/admin` (stay UA), the SEO skill (separate project). |
| Locale detection | No automatic `Accept-Language` redirect. Explicit language switcher; UA default; choice persisted. |
| RU production | Generated via `trademua-content-ua` skill (mining terminology preserved); human review. |

---

## Architecture

### File structure
```
src/
├── i18n/
│   ├── routing.ts          # locales ['uk','ru'], defaultLocale 'uk', localePrefix 'as-needed'
│   ├── request.ts          # getRequestConfig — load messages for active locale (server)
│   └── navigation.ts       # locale-aware Link / redirect / usePathname / useRouter
├── messages/
│   ├── uk.json             # namespaces: common, nav, home, services, calculator,
│   └── ru.json             #             products, about, contact, faq, footer, auth, meta
├── middleware.ts           # MERGE: next-intl middleware + existing auth-gating
└── app/
    └── [locale]/           # all 21 pages move under this segment
        ├── layout.tsx       # <html lang={locale}>, NextIntlClientProvider, hreflang alternates
        ├── page.tsx
        ├── products/  products/[slug]/  services/  calculator/
        ├── about/  contact/  cart/  faq/ (if present)
        ├── login/  register/  auth/…
        └── dashboard/  admin/    # UI chrome stays UA (not translated), but still live under [locale]
```

### Critical: middleware merge
`src/middleware.ts` already exists and gates `/dashboard` and `/admin` (Supabase auth). next-intl ships its own middleware. These must be composed into one exported `middleware` + `config.matcher`:
1. Run the next-intl middleware first to resolve locale / rewrite.
2. Then apply the existing auth check on the locale-stripped pathname (so `/ru/dashboard` is gated the same as `/dashboard`).
3. Reconcile `config.matcher` so it covers both i18n routing and the auth-protected routes, while excluding `/api`, `/_next`, static assets, and the GA/SEO files.

This is the highest-risk task; it gets implemented and verified before the bulk page migration.

---

## String extraction

- Extract hardcoded Ukrainian strings from ~45 `.tsx` files into `messages/uk.json`, organized by namespace (one namespace per page/area).
- `ru.json` mirrors the same keys.
- **Server Components:** `getTranslations(namespace)`.
- **Client Components** (`"use client"`): `useTranslations(namespace)` inside `NextIntlClientProvider` (provided in `[locale]/layout.tsx`).
- Work proceeds page-by-page / namespace-by-namespace so translation and review stay manageable.

## SEO

- `<html lang={locale}>` per request.
- `generateMetadata` returns localized `title` / `description` (from the `meta` namespace).
- `alternates.languages` on every page: `uk`, `ru`, and `x-default → uk` (hreflang).
- New `src/app/sitemap.ts` emitting both locales with `alternates`; new `src/app/robots.ts`.
- Language switcher in the navbar (locale-aware `usePathname` to swap prefix); persists choice; no header-based auto-redirect.

## Translation production & boundaries

- RU copy generated via `trademua-content-ua` (preserve ASIC/mining terminology, premium/technical tone); user reviews before merge.
- **In scope:** nav, home, services, about, contact, faq, calculator labels, cart, auth (login/register), footer, page metadata.
- **Not translated now:** catalog data; `/dashboard` and `/admin` chrome (remain UA); EN (future).

---

## Risks / sequencing

1. **Middleware merge** — implement & verify first (auth still gates `/ru/admin`, `/admin`; no redirect loops).
2. **Page migration into `[locale]/`** — large move; verify routing + existing UA URLs still resolve at root.
3. **String extraction** — incremental, namespace by namespace; risk of missed strings → verify by scanning for residual Cyrillic in JSX after each area.
4. **SEO correctness** — validate hreflang/sitemap output after migration.

## Success criteria

- UA pages resolve at existing root URLs unchanged; RU equivalents at `/ru/…`.
- Auth gating works identically for both locales.
- No hardcoded UA strings remain in in-scope public components (verified by Cyrillic scan).
- hreflang + localized metadata + bilingual sitemap present and valid.
- `tsc` + build pass.
