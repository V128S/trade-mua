import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

// Blog cluster: markdown articles per locale at
// src/content/blog/<slug>.<locale>.md with frontmatter { title, description,
// date }. Order in BLOG_SLUGS is the canonical publishing order.
export const BLOG_SLUGS = [
  "how-to-choose-asic-2026",
  "asic-profitability-payback",
  "mining-hotel-vs-home",
  "bitcoin-mining-ukraine-2026",
  "antminer-s21-vs-s23",
  "asic-repair-guide",
  "asic-firmware-guide",
  "kaspa-mining-ukraine-2026",
  "litecoin-dogecoin-scrypt-mining-2026",
  "asic-cooling-air-hydro-immersion-2026",
  "electricity-cost-mining-ukraine-2026",
  "home-mining-quiet-asic-2026",
  "mining-pool-guide-2026",
] as const;
export type BlogSlug = (typeof BLOG_SLUGS)[number];

const DIR = path.join(process.cwd(), "src/content/blog");

export interface BlogMeta {
  title: string;
  description: string;
  date: string; // ISO yyyy-mm-dd
}
export interface BlogPost extends BlogMeta {
  slug: string;
  body: string;
}

function readFile(slug: string, locale: string): { meta: BlogMeta; body: string } | null {
  // Prefer the requested locale; fall back to the default (uk) so a missing
  // translation still renders rather than 404s.
  const candidates = [
    path.join(DIR, `${slug}.${locale}.md`),
    path.join(DIR, `${slug}.uk.md`),
  ];
  const file = candidates.find((p) => fs.existsSync(p));
  if (!file) return null;
  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  return { meta: data as BlogMeta, body: content.trim() };
}

export function getPost(slug: string, locale: string): BlogPost | null {
  if (!BLOG_SLUGS.includes(slug as BlogSlug)) return null;
  const r = readFile(slug, locale);
  return r ? { slug, ...r.meta, body: r.body } : null;
}

export function getAllPosts(locale: string): BlogPost[] {
  const order = new Map<string, number>(BLOG_SLUGS.map((slug, i) => [slug, i] as [string, number]));
  return BLOG_SLUGS.map((slug) => getPost(slug, locale))
    .filter((p): p is BlogPost => p !== null)
    .sort((a, b) => {
      // Newest first by date; tie-break by publishing order (later entries in
      // BLOG_SLUGS first) so same-day posts get a stable, deterministic order
      // instead of relying on an inconsistent comparator.
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return (order.get(b.slug) ?? 0) - (order.get(a.slug) ?? 0);
    });
}

// Slug → publish date (from uk frontmatter) for sitemap lastModified.
export function getBlogDates(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const slug of BLOG_SLUGS) {
    const r = readFile(slug, "uk");
    if (r?.meta.date) out[slug] = r.meta.date;
  }
  return out;
}
