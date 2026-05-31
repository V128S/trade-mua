import type { MetadataRoute } from "next";
import { getProductsFromDB } from "@/lib/products";

const BASE = "https://trade-mua.vercel.app";
const STATIC_PATHS = ["", "/products", "/services", "/calculator", "/about", "/contact", "/asic/sha256"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProductsFromDB();
  const productPaths = products.map((p) => `/products/${p.id}`);
  const allPaths = [...STATIC_PATHS, ...productPaths];

  return allPaths.map((path) => ({
    url: `${BASE}${path}`,
    alternates: {
      languages: {
        uk: `${BASE}${path}`,
        ru: `${BASE}/ru${path}`,
        "x-default": `${BASE}${path}`,
      },
    },
  }));
}
