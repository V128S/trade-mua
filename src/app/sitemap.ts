import type { MetadataRoute } from "next";
import { getProductsFromDB } from "@/lib/products";
import { BLOG_SLUGS } from "@/lib/blog";

const BASE = "https://trade-mua.vercel.app";
const STATIC_PATHS = ["", "/products", "/services", "/calculator", "/blog", "/contact", "/asic/sha256", "/asic/scrypt", "/asic/zcash", "/asic/kaspa"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProductsFromDB();
  const productPaths = products.map((p) => `/products/${p.id}`);
  const blogPaths = BLOG_SLUGS.map((slug) => `/blog/${slug}`);
  const allPaths = [...STATIC_PATHS, ...blogPaths, ...productPaths];

  return allPaths.map((path) => ({
    url: `${BASE}${path}`,
    alternates: {
      languages: {
        uk: `${BASE}${path}`,
        en: `${BASE}/en${path}`,
        ru: `${BASE}/ru${path}`,
        "x-default": `${BASE}${path}`,
      },
    },
  }));
}
