import type { MetadataRoute } from "next";
import { getProductModifiedDates } from "@/lib/products";
import { BLOG_SLUGS } from "@/lib/blog";

const BASE = "https://традем.com.ua";
const STATIC_PATHS = ["", "/products", "/services", "/calculator", "/blog", "/contact", "/asic/sha256", "/asic/scrypt", "/asic/zcash", "/asic/kaspa", "/asic/antminer"];

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
  const dateMap = new Map(productDates.map((p) => [p.id, p.syncedAt]));

  // Use the most recent sync time as the proxy date for static hub/category pages
  const latestSync = productDates.reduce<string | null>((max, p) => {
    if (!p.syncedAt) return max;
    return !max || p.syncedAt > max ? p.syncedAt : max;
  }, null);

  const staticEntries = STATIC_PATHS.map((path) => entry(path, latestSync ?? undefined));
  const blogEntries = BLOG_SLUGS.map((slug) => entry(`/blog/${slug}`));
  const productEntries = productDates.map((p) => entry(`/products/${p.id}`, p.syncedAt ?? undefined));

  return [...staticEntries, ...blogEntries, ...productEntries];
}
