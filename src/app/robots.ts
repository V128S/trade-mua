import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/dashboard", "/api", "/en/admin", "/en/dashboard", "/ru/admin", "/ru/dashboard", "/login", "/register", "/auth", "/cart", "/checkout", "/en/checkout", "/ru/checkout"],
    },
    sitemap: "https://trade-mua.vercel.app/sitemap.xml",
  };
}
