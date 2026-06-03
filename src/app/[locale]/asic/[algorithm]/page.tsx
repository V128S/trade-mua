import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductsFromDB } from "@/lib/products";
import { getMinerstatRevenue } from "@/lib/minerstat";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ProductCard } from "@/components/products/ProductCard";
import JsonLd from "@/components/seo/JsonLd";

export const revalidate = 60;

const SITE_URL = "https://trade-mua.vercel.app";

// Indexable algorithm hubs. slug → DB `algorithm` value. Seeded with SHA-256
// (the largest cluster); add more entries to spin up new hubs.
// `faqCount` / `hasBody` opt a hub into the extended SEO sections (intro body +
// FAQ + FAQPage schema). Hubs without them render the lean layout unchanged.
const HUBS: Record<string, { dbAlgo: string; faqCount?: number; hasBody?: boolean }> = {
  sha256: { dbAlgo: "SHA256", faqCount: 6, hasBody: true },
  scrypt: { dbAlgo: "Scrypt", faqCount: 6, hasBody: true },
  kaspa: { dbAlgo: "KHeavyHash" },
};

export function generateStaticParams() {
  return Object.keys(HUBS).map((algorithm) => ({ algorithm }));
}

type Props = { params: Promise<{ locale: string; algorithm: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, algorithm } = await params;
  if (!HUBS[algorithm]) return {};
  const t = await getTranslations({ locale, namespace: "asicHub" });
  const path = `/asic/${algorithm}`;
  const localePrefix = locale === "uk" ? "" : `/${locale}`;
  return {
    title: t(`${algorithm}Title`),
    description: t(`${algorithm}Description`),
    alternates: {
      // self-referential canonical per locale (EN must not point at the UA URL)
      canonical: `${localePrefix}${path}`,
      languages: { uk: path, en: `/en${path}`, ru: `/ru${path}`, "x-default": path },
    },
  };
}

export default async function AsicHubPage({ params }: Props) {
  const { locale, algorithm } = await params;
  setRequestLocale(locale);

  const hub = HUBS[algorithm];
  if (!hub) notFound();

  const [products, revenueMap, t, tp] = await Promise.all([
    getProductsFromDB(),
    getMinerstatRevenue(),
    getTranslations("asicHub"),
    getTranslations("products"),
  ]);

  const items = products
    .filter((p) => p.algorithm === hub.dbAlgo)
    .sort((a, b) => b.priceUSDT - a.priceUSDT);
  if (items.length === 0) notFound();

  const revenuePerTH = revenueMap[hub.dbAlgo]?.revenuePerTH ?? 0;
  const localePrefix = locale === "uk" ? "" : `/${locale}`;
  const hubUrl = `${SITE_URL}${localePrefix}/asic/${algorithm}`;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: tp("breadcrumbHome"), item: `${SITE_URL}${localePrefix}/` },
      { "@type": "ListItem", position: 2, name: tp("breadcrumbProducts"), item: `${SITE_URL}${localePrefix}/products` },
      { "@type": "ListItem", position: 3, name: t(`${algorithm}H1`), item: hubUrl },
    ],
  };
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.slice(0, 20).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}${localePrefix}/products/${p.id}`,
    })),
  };

  // Extended SEO content (only for hubs configured with it — e.g. sha256)
  const faqs = Array.from({ length: hub.faqCount ?? 0 }, (_, i) => ({
    q: t(`${algorithm}Faq${i + 1}Q`),
    a: t(`${algorithm}Faq${i + 1}A`),
  }));
  const faqLd = faqs.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }
    : null;
  const jsonLd = faqLd ? [breadcrumbLd, itemListLd, faqLd] : [breadcrumbLd, itemListLd];

  return (
    <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-16 pb-section-gap">
      <JsonLd data={jsonLd} />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px] mb-8">
        <Link href="/" className="hover:text-primary transition-colors">{tp("breadcrumbHome")}</Link>
        <span className="material-symbols-outlined text-[12px]">chevron_right</span>
        <Link href="/products" className="hover:text-primary transition-colors">{tp("breadcrumbProducts")}</Link>
        <span className="material-symbols-outlined text-[12px]">chevron_right</span>
        <span className="text-on-surface uppercase">{t(`${algorithm}H1`)}</span>
      </nav>

      {/* Hub intro */}
      <header className="mb-10 max-w-3xl">
        <h1 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest mb-4">
          {t(`${algorithm}H1`)}
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          {t(`${algorithm}Intro`)}
        </p>
        <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest mt-4">
          {t("modelsCount", { count: items.length })}
        </p>
      </header>

      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-gutter">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} revenuePerTH={revenuePerTH} />
        ))}
      </div>

      {/* SEO body */}
      {hub.hasBody && (
        <section className="mt-16 max-w-3xl">
          <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest mb-4">
            {t(`${algorithm}BodyHeading`)}
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
            {t(`${algorithm}Body`)}
          </p>
        </section>
      )}

      {/* FAQ */}
      {faqs.length > 0 && (
        <section className="mt-16">
          <h2 className="font-headline-md text-headline-md gold-text uppercase tracking-widest mb-8">
            {t("faqHeading")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {faqs.map((f) => (
              <details key={f.q} className="glass p-5 group">
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none">
                  <span className="font-technical-data text-technical-data text-on-surface text-sm">{f.q}</span>
                  <span className="material-symbols-outlined text-primary text-[18px] transition-transform group-open:rotate-180">expand_more</span>
                </summary>
                <p className="font-body-md text-body-md text-on-surface-variant text-sm leading-relaxed mt-3">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Internal links */}
      <div className="flex flex-wrap justify-center gap-3 mt-16">
        <Link href="/products" className="btn-ghost px-8 py-3 rounded font-label-caps text-label-caps uppercase tracking-widest text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">grid_view</span>
          {t("allCatalog")}
        </Link>
        <Link href="/calculator" className="btn-ghost px-8 py-3 rounded font-label-caps text-label-caps uppercase tracking-widest text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">calculate</span>
          {t("toCalculator")}
        </Link>
      </div>
    </div>
  );
}
