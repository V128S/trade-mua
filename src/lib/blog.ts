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
  return BLOG_SLUGS.map((slug) => getPost(slug, locale))
    .filter((p): p is BlogPost => p !== null)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}
