import type { MetadataRoute } from "next";
import { getProductModifiedDates } from "@/lib/products";
import { getCanonicalSlug } from "@/lib/sheets";
import { BLOG_SLUGS, getBlogDates } from "@/lib/blog";
import { SITE_URL } from "@/lib/site";

const BASE = SITE_URL;
const STATIC_PATHS = ["", "/products", "/services", "/calculator", "/blog", "/contact", "/asic/sha256", "/asic/scrypt", "/asic/zcash", "/asic/kaspa", "/asic/antminer", "/asic/avalon", "/asic/fluminer"];

function entry(path: string, lastModified?: Date | string): MetadataRoute.Sitemap[number] {
  return {
    url: `${BASE}${path}`,
    ...(lastModified ? { lastModified: new Date(lastModified) } : {}),
    alternates: {
      languages: {
        uk: `${BASE}${path}`,
        en: `${BASE}/en${path}`,
        ru: `${BASE}/ru${path}`,
        "x-default": `${BASE}${path}`,
      },
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const productDates = await getProductModifiedDates();

  // Use the most recent sync time as the proxy date for static hub/category pages
  const latestSync = productDates.reduce<string | null>((max, p) => {
    if (!p.syncedAt) return max;
    return !max || p.syncedAt > max ? p.syncedAt : max;
  }, null);

  const staticEntries = STATIC_PATHS.map((path) => entry(path, latestSync ?? undefined));
  const blogDates = getBlogDates();
  const blogEntries = BLOG_SLUGS.map((slug) => entry(`/blog/${slug}`, blogDates[slug]));
  // Batch siblings (same model+hashrate, different delivery month) share one
  // stable family-slug URL — list it once, with the most recent sync time
  // among the siblings so lastModified reflects any of them changing.
  const bySlug = new Map<string, string | null>();
  for (const p of productDates) {
    const slug = getCanonicalSlug(p);
    const existing = bySlug.get(slug);
    if (existing === undefined || (p.syncedAt ?? "") > (existing ?? "")) {
      bySlug.set(slug, p.syncedAt);
    }
  }
  const productEntries = [...bySlug.entries()].map(([slug, syncedAt]) => entry(`/products/${slug}`, syncedAt ?? undefined));

  return [...staticEntries, ...blogEntries, ...productEntries];
}
