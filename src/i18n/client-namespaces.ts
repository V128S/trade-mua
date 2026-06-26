// i18n namespaces hydrated to the browser. Keep in sync with every
// `useTranslations('<ns>')` call inside a 'use client' component — the test in
// client-namespaces.test.ts fails if a client component uses an unlisted ns.
export const CLIENT_NAMESPACES = [
  'auth', 'calculator', 'cart', 'checkout', 'common', 'errors', 'home', 'nav', 'products',
] as const
