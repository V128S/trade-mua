import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/dashboard", "/api", "/ru/admin", "/ru/dashboard", "/login", "/register", "/auth", "/cart"],
    },
    sitemap: "https://trade-mua.vercel.app/sitemap.xml",
  };
}
