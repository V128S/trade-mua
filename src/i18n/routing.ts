import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // "ru" is a hidden SEO-only locale: it is a real, crawlable locale (pages at
  // /ru/... return 200 and are listed in sitemap + hreflang) but is intentionally
  // NOT shown in the visible LocaleSwitcher. Russian-speaking searchers land on
  // /ru pages from Google; the brand experience stays UA-first by default.
  locales: ["uk", "en", "ru"],
  defaultLocale: "uk",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
