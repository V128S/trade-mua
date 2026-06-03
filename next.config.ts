import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project — stray lockfiles in a parent dir
  // (e.g. ~/package-lock.json) otherwise make Next infer the wrong root.
  turbopack: {
    root: __dirname,
  },
  // Tree-shake barrel imports so unused exports don't bloat client bundles.
  experimental: {
    optimizePackageImports: ["next-intl"],
  },
  // Blog articles are read from src/content/blog via fs at render time — make
  // sure those markdown files are bundled into the Vercel functions.
  outputFileTracingIncludes: {
    "/[locale]/blog": ["./src/content/blog/**"],
    "/[locale]/blog/[slug]": ["./src/content/blog/**"],
  },
  // Add smaller candidates (160/192) so small product thumbnails don't jump
  // straight to the 256w source — trims over-sized image delivery.
  images: {
    imageSizes: [16, 32, 48, 64, 96, 128, 160, 192, 256, 384],
    // Product photos can be pasted as external URLs in the Google Sheet
    // (image_url column). Allow any https host so the manager isn't blocked by
    // CDN choice; the content is admin-controlled via the sheet sync.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  async redirects() {
    // /about was merged into /contact (story + stats + values now live there).
    // Keep the old URLs alive with permanent redirects for both locales.
    return [
      { source: "/about", destination: "/contact", permanent: true },
      { source: "/en/about", destination: "/en/contact", permanent: true },
      // /ru is a hidden SEO-only locale (real pages, not in the UI). It must NOT
      // redirect to /en, so the old /ru -> /en rules are gone. Keep only the
      // about -> contact parity so the merged page stays consistent per locale.
      { source: "/ru/about", destination: "/ru/contact", permanent: true },
    ];
  },
};

// Defaults to ./src/i18n/request.ts
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
