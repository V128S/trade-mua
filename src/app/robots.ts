import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin", "/dashboard", "/api",
        "/en/admin", "/en/dashboard",
        "/ru/admin", "/ru/dashboard",
        "/login", "/register", "/auth",
        "/en/login", "/en/register", "/en/auth",
        "/ru/login", "/ru/register", "/ru/auth",
        "/cart", "/checkout",
        "/en/checkout", "/ru/checkout",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
