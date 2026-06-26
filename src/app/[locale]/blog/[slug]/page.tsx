import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPost, getAllPosts, BLOG_SLUGS } from "@/lib/blog";
import PostBody from "@/components/blog/PostBody";
import JsonLd from "@/components/seo/JsonLd";

export const dynamicParams = false;
import { SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return BLOG_SLUGS.map((slug) => ({ slug }));
}

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getPost(slug, locale);
  if (!post) return {};
  const path = `/blog/${slug}`;
  const localePrefix = locale === "uk" ? "" : `/${locale}`;
  return {
    title: `${post.title} | TradeM`,
    description: post.description,
    alternates: {
      canonical: `${localePrefix}${path}`,
      languages: { uk: path, en: `/en${path}`, ru: `/ru${path}`, "x-default": path },
    },
    openGraph: { type: "article", title: post.title, description: post.description },
  };
}

function formatDate(date: string, locale: string) {
  const loc = { uk: "uk-UA", en: "en-US", ru: "ru-RU" }[locale] ?? "uk-UA";
  return new Date(date).toLocaleDateString(loc, { day: "2-digit", month: "long", year: "numeric" });
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const post = getPost(slug, locale);
  if (!post) notFound();

  const [t, tn] = await Promise.all([getTranslations("blog"), getTranslations("nav")]);
  const localePrefix = locale === "uk" ? "" : `/${locale}`;
  const url = `${SITE_URL}${localePrefix}/blog/${slug}`;

  const related = getAllPosts(locale).filter((p) => p.slug !== slug).slice(0, 2);

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    inLanguage: { uk: "uk-UA", en: "en-US", ru: "ru-RU" }[locale] ?? "uk-UA",
    image: `${SITE_URL}${localePrefix}/opengraph-image`,
    mainEntityOfPage: url,
    author: { "@type": "Organization", name: "TradeM" },
    publisher: { "@type": "Organization", name: "TradeM", logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.png` } },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: tn("home"), item: `${SITE_URL}${localePrefix}/` },
      { "@type": "ListItem", position: 2, name: tn("blog"), item: `${SITE_URL}${localePrefix}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: url },
    ],
  };

  return (
    <article className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-16 pb-section-gap">
      <JsonLd data={[articleLd, breadcrumbLd]} />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px] mb-8">
        <Link href="/" className="hover:text-primary transition-colors">{tn("home")}</Link>
        <span className="material-symbols-outlined text-[12px]">chevron_right</span>
        <Link href="/blog" className="hover:text-primary transition-colors">{tn("blog")}</Link>
      </nav>

      {/* Header */}
      <header className="mb-10 max-w-3xl">
        <p className="font-label-caps text-label-caps text-primary uppercase tracking-widest text-[11px] mb-3">
          {formatDate(post.date, locale)}
        </p>
        <h1 className="font-headline-lg text-headline-lg text-on-surface leading-tight">{post.title}</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-4 leading-relaxed">{post.description}</p>
      </header>

      {/* Body */}
      <PostBody>{post.body}</PostBody>

      {/* CTA */}
      <div className="glass p-8 md:p-10 mt-16 max-w-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div>
          <h2 className="font-headline-md text-headline-md gold-text uppercase tracking-widest">{t("ctaHeading")}</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">{t("ctaBody")}</p>
        </div>
        <Link href="/products" className="btn-primary py-4 px-8 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center gap-2 shrink-0">
          {t("ctaButton")}
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </Link>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-headline-md text-headline-md gold-text uppercase tracking-widest mb-6">{t("relatedHeading")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {related.map((p) => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className="glass glass-hover p-6 flex flex-col gap-2 group">
                <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">{formatDate(p.date, locale)}</p>
                <h3 className="font-technical-data text-technical-data text-on-surface group-hover:text-primary transition-colors leading-snug">{p.title}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant text-sm line-clamp-2">{p.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
