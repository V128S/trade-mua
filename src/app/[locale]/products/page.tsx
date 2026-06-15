import type { Metadata } from "next";
import { getProductsFromDB } from "@/lib/products";
import { getMinerstatRevenue } from "@/lib/minerstat";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import ProductsCatalog from "@/components/products/ProductsCatalog";
import JsonLd from "@/components/seo/JsonLd";

const HUBS = [
  { slug: "antminer", labelKey: "hubAntminer" as const },
  { slug: "sha256",   labelKey: "hubSha256"   as const },
  { slug: "scrypt",   labelKey: "hubScrypt"   as const },
  { slug: "kaspa",    labelKey: "hubKaspa"    as const },
  { slug: "zcash",    labelKey: "hubZcash"    as const },
] as const;

export const revalidate = 60;

const SITE_URL = "https://tradem.com.ua";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "products" });
  const localePrefix = locale === "uk" ? "" : `/${locale}`;
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      // self-referential canonical per locale — keeps faceted ?query URLs out of the index
      canonical: `${localePrefix}/products`,
      languages: {
        uk: "/products",
        en: "/en/products",
        ru: "/ru/products",
        "x-default": "/products",
      },
    },
  };
}

export default async function ProductsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [products, revenueMap, t] = await Promise.all([
    getProductsFromDB(),
    getMinerstatRevenue(),
    getTranslations("products"),
  ]);

  // Flatten to algorithm → revenuePerTH for lightweight per-card profit estimates
  const revenueByAlgo: Record<string, number> = Object.fromEntries(
    Object.entries(revenueMap).map(([algo, data]) => [algo, data.revenuePerTH]),
  );

  const localePrefix = locale === "uk" ? "" : `/${locale}`;
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t("breadcrumbHome"), item: `${SITE_URL}${localePrefix}/` },
      { "@type": "ListItem", position: 2, name: t("breadcrumbProducts"), item: `${SITE_URL}${localePrefix}/products` },
    ],
  };

  const catalogFaqs = [
    { q: t("catalogFaq1Q"), a: t("catalogFaq1A") },
    { q: t("catalogFaq2Q"), a: t("catalogFaq2A") },
    { q: t("catalogFaq3Q"), a: t("catalogFaq3A") },
  ];
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: catalogFaqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-16 pb-section-gap">
      <JsonLd data={[breadcrumbLd, faqLd]} />
      <ProductsCatalog products={products} revenueByAlgo={revenueByAlgo} />

      {/* SEO text + hub links + FAQ — below the fold, after the product grid */}
      <section className="mt-20 max-w-3xl">
        <div className="head-rule mb-8">
          <div className="line" />
          <h2 className="font-headline-md text-headline-md gold-text uppercase tracking-widest whitespace-nowrap text-base">
            {t("catalogSeoHeading")}
          </h2>
          <div className="line" />
        </div>
        <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
          {t("catalogSeoBody")}
        </p>
      </section>

      {/* Hub shortcuts */}
      <section className="mt-10 max-w-3xl">
        <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px] mb-4">
          {t("catalogHubsHeading")}
        </p>
        <div className="flex flex-wrap gap-2">
          {HUBS.map((h) => (
            <Link
              key={h.slug}
              href={`/asic/${h.slug}`}
              className="chip px-3 py-1.5 font-label-caps text-[11px] uppercase tracking-wider hover:bg-primary/20 hover:border-primary/50 transition-colors"
            >
              {t(h.labelKey)}
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-10 max-w-3xl">
        <div className="grid grid-cols-1 gap-3">
          {catalogFaqs.map((f) => (
            <details key={f.q} className="glass p-5 group">
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none">
                <span className="font-technical-data text-technical-data text-on-surface text-sm">{f.q}</span>
                <span className="material-symbols-outlined text-primary text-[18px] transition-transform group-open:rotate-180 shrink-0">expand_more</span>
              </summary>
              <p className="font-body-md text-body-md text-on-surface-variant text-sm leading-relaxed mt-3">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
