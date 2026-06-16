// Ambient typing for the gtag.js function injected by the GA <Script> in
// src/app/[locale]/layout.tsx. Declared here (rather than a sibling gtag.d.ts,
// which TS treats as this module's declaration file) so the augmentation is
// reliably applied.
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

// The single low-level entry point for every GA4 event. Guards on browser +
// gtag presence so calls are safe on the server, in dev (GA is prod-only) and
// before the lazyOnload GA script has loaded. Never throws — analytics must
// never break UX.
const DEBUG = process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === '1'

export function gtagEvent(name: string, params: Record<string, unknown>): void {
  if (DEBUG) {
    // Visible in dev, where GA itself does not load.
    console.debug('[ga]', name, params)
  }
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  try {
    window.gtag('event', name, params)
  } catch (err) {
    console.error('[ga] event failed', name, err)
  }
}
