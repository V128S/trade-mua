import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getAllPosts } from "@/lib/blog";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { languages: { uk: "/blog", en: "/en/blog", ru: "/ru/blog", "x-default": "/blog" } },
  };
}

function formatDate(date: string, locale: string) {
  const loc = { uk: "uk-UA", en: "en-US", ru: "ru-RU" }[locale] ?? "uk-UA";
  return new Date(date).toLocaleDateString(loc, { day: "2-digit", month: "long", year: "numeric" });
}

export default async function BlogIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("blog");
  const posts = getAllPosts(locale);

  return (
    <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-16 pb-section-gap">
      <header className="mb-12 max-w-3xl">
        <p className="font-label-caps text-label-caps text-primary uppercase tracking-widest text-[11px] mb-3">{t("heroLabel")}</p>
        <h1 className="font-headline-lg text-headline-lg text-on-surface leading-tight">{t("heroTitle")}</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-4 leading-relaxed">{t("heroBody")}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter">
        {posts.map((p) => (
          <Link key={p.slug} href={`/blog/${p.slug}`} className="glass glass-hover p-7 flex flex-col gap-3 group h-full">
            <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">{formatDate(p.date, locale)}</p>
            <h2 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors leading-snug text-lg">{p.title}</h2>
            <p className="font-body-md text-body-md text-on-surface-variant text-sm flex-1">{p.description}</p>
            <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest text-[10px] inline-flex items-center gap-1 mt-2">
              {t("readMore")}
              <span className="material-symbols-outlined text-[14px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
