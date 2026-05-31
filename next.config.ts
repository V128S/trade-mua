import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // Tree-shake barrel imports so unused exports don't bloat client bundles.
  experimental: {
    optimizePackageImports: ["next-intl"],
  },
  async redirects() {
    // /about was merged into /contact (story + stats + values now live there).
    // Keep the old URLs alive with permanent redirects for both locales.
    return [
      { source: "/about", destination: "/contact", permanent: true },
      { source: "/ru/about", destination: "/ru/contact", permanent: true },
    ];
  },
};

// Defaults to ./src/i18n/request.ts
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
