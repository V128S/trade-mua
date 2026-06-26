// Hub chips shown on the catalog page footer. The asic/[algorithm] route keeps
// its own richer HUBS config (algorithm/brand/faqCount/hasBody) — this is only
// the slug+label list the catalog links to, shared to avoid drift.
export const PRODUCT_HUBS = [
  { slug: 'antminer', labelKey: 'hubAntminer' },
  { slug: 'avalon',   labelKey: 'hubAvalon'   },
  { slug: 'fluminer', labelKey: 'hubFluminer' },
  { slug: 'sha256',   labelKey: 'hubSha256'   },
  { slug: 'scrypt',   labelKey: 'hubScrypt'   },
  { slug: 'kaspa',    labelKey: 'hubKaspa'    },
  { slug: 'zcash',    labelKey: 'hubZcash'    },
] as const
