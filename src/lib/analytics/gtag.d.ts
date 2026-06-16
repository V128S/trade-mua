// Ambient typing for the gtag.js function injected by the GA <Script> in
// src/app/[locale]/layout.tsx. Without this, window.gtag is untyped.
export {}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}
