import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // "ru" is a hidden SEO-only locale: it is a real, crawlable locale (pages at
  // /ru/... return 200 and are listed in sitemap + hreflang) but is intentionally
  // NOT shown in the visible LocaleSwitcher. Russian-speaking searchers land on
  // /ru pages from Google; the brand experience stays UA-first by default.
  locales: ["uk", "en", "ru"],
  defaultLocale: "uk",
  localePrefix: "as-needed",
  // Always serve Ukrainian at the root path. Without this, next-intl picks the
  // locale from the Accept-Language header, so crawlers/bots (e.g. Telegram's
  // link-preview fetcher sending "en") get the English version at "/". Visitors
  // switch language manually via the switcher.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
