import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { getProductsFromDB } from "@/lib/products";
import { getFamilySlug, getCanonicalSlug, type Product } from "@/lib/sheets";
import ProductHero from "@/components/products/ProductHero";
import { getProductImage } from "@/lib/product-images";
import { getMinerstatRevenue } from "@/lib/minerstat";
import { getUsdUahRate } from "@/lib/fx";
import { getModelContentKey } from "@/lib/model-content";
import { collapseBatches, monthsFromNow, type BatchMonth } from "@/lib/batch";
import JsonLd from "@/components/seo/JsonLd";
import TrustBar from "@/components/ui/TrustBar";
import { getTranslations, setRequestLocale } from "next-intl/server";

export const revalidate = 60;

import { SITE_URL } from "@/lib/site";

// Offer needs a future priceValidUntil. Computed once at module load (refreshes
// on each deploy/ISR rebuild) so it isn't an impure call during render.
const PRICE_VALID_UNTIL = new Date(Date.now() + 365 * 86400000)
  .toISOString()
  .slice(0, 10);

// Maps DB algorithm value → hub slug + short display label.
// Only algorithms that have an indexable hub page are listed here.
// AntMiner models with no algo hub fall back to the brand hub.
const ALGO_HUB: Record<string, { slug: string; label: string }> = {
  SHA256:     { slug: "sha256", label: "SHA-256" },
  Scrypt:     { slug: "scrypt", label: "Scrypt"  },
  KHeavyHash: { slug: "kaspa",  label: "KHeavyHash" },
  Equihash:   { slug: "zcash",  label: "Equihash"   },
};
const BRAND_HUB: Record<string, { slug: string; label: string }> = {
  AntMiner: { slug: "antminer", label: "Antminer" },
  Avalon:   { slug: "avalon",   label: "Avalon"   },
  FluMiner: { slug: "fluminer", label: "FluMiner" },
};

// Strip hashrate suffix to get base model name
// "Antminer S21 Hydro 335Th" → "Antminer S21 Hydro"
function getBaseName(name: string): string {
  return name.replace(/\s*\d[\d.,]*\s*(?:TH\/s|GH\/s|MH\/s|Th|Gh|Mh|T|G|M)\s*$/i, "").trim();
}

function getCooling(name: string): string {
  if (/hyd/i.test(name)) return "Hydro";
  if (/imm/i.test(name)) return "Immersion";
  return "Air";
}

// Batch products are looked up primarily by their stable family slug (no
// month) — falls back to an exact row-id match for old/direct links to a
// specific batch's own id. Picks the soonest batch when several match.
function findProductBySlug(products: Product[], slug: string): Product | undefined {
  const exact = products.find((p) => p.id === slug);
  if (exact) return exact;
  const familyMatches = products.filter((p) => p.batch && getFamilySlug(p) === slug);
  return collapseBatches(familyMatches)[0];
}


type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const [products, t] = await Promise.all([
    getProductsFromDB(),
    getTranslations({ locale, namespace: "products" }),
  ]);
  const product = findProductBySlug(products, slug);
  if (!product) return { title: "TradeM" };
  const path = `/products/${getCanonicalSlug(product)}`;
  const localePrefix = locale === "uk" ? "" : `/${locale}`;
  return {
    title: t("metaSlugTitle", { name: product.name }),
    description: t("metaSlugDescription", {
      name: product.name,
      hashrate: product.hashrate,
      power: product.powerW,
    }),
    alternates: {
      // self-referential canonical per locale (EN must not point at the UA URL)
      canonical: `${localePrefix}${path}`,
      languages: { uk: path, en: `/en${path}`, ru: `/ru${path}`, "x-default": path },
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("products");

  const [products, revenueMap, usdUah] = await Promise.all([getProductsFromDB(), getMinerstatRevenue(), getUsdUahRate()]);

  const product = findProductBySlug(products, slug);
  if (!product) notFound();

  // Revenue for this product's specific algorithm
  const algoData = revenueMap[product.algorithm] ?? revenueMap["SHA256"];
  const revenuePerTH = algoData?.revenuePerTH ?? 0;

  const baseName = getBaseName(product.name);
  const cooling = getCooling(product.name);

  // All configurations = same base name, one per hashrate — supply-batch
  // siblings (same name+hashrate, different delivery month) collapse to
  // their soonest batch here; the full batch choice is its own selector
  // below, sorted by hashrate desc
  const configs = collapseBatches(products.filter((p) => getBaseName(p.name) === baseName))
    .sort((a, b) => b.priceUSDT - a.priceUSDT);

  // Supply-batch siblings for this exact hashrate — same name+hashrate,
  // differing only by delivery month ("(Dec)"/"(Jan)"/… in the Sheet),
  // sorted soonest-first.
  const batches = products
    .filter((p) => p.name === product.name && p.hashrate === product.hashrate && p.batch)
    .sort((a, b) => monthsFromNow(a.batch as BatchMonth) - monthsFromNow(b.batch as BatchMonth));

  // Similar models = same algorithm, different base name, max 4 (batch
  // siblings collapsed — same reasoning as the catalog grid)
  const similar = collapseBatches(
    products.filter((p) => p.algorithm === product.algorithm && getBaseName(p.name) !== baseName),
  ).slice(0, 4);

  const specs = [
    { label: t("specAlgorithm"), value: product.algorithm },
    { label: t("specHashrate"), value: product.hashrate || "—" },
    { label: t("specPower"), value: `${product.powerW} W` },
    { label: t("specCooling"), value: cooling },
  ];

  const descKey = cooling === "Hydro" ? "descHydro" : cooling === "Immersion" ? "descImmersion" : "descAir";

  // Curated per-model SEO copy (description + FAQ) for top Antminer families.
  const modelKey = getModelContentKey(product.name);
  const modelFaqs = modelKey
    ? [1, 2, 3].map((i) => ({
        q: t(`model${modelKey}Faq${i}Q`),
        a: t(`model${modelKey}Faq${i}A`),
      }))
    : [];

  // ── Structured data (built from live catalog data) ──
  const localePrefix = locale === "uk" ? "" : `/${locale}`;
  const productUrl = `${SITE_URL}${localePrefix}/products/${getCanonicalSlug(product)}`;

  // Resolve which hub (algo > brand) this product belongs to for breadcrumbs
  const hub = ALGO_HUB[product.algorithm] ?? BRAND_HUB[product.brand] ?? null;
  const hubUrl = hub ? `${SITE_URL}${localePrefix}/asic/${hub.slug}` : null;
  const productImg = getProductImage(product.name, product.imageUrl);
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.id,
    description: t(descKey),
    brand: { "@type": "Brand", name: product.name.split(" ")[0] },
    ...(productImg ? { image: `${SITE_URL}${productImg}` } : {}),
    additionalProperty: [
      { "@type": "PropertyValue", name: "Algorithm", value: product.algorithm },
      ...(product.hashrate ? [{ "@type": "PropertyValue", name: "Hashrate", value: product.hashrate }] : []),
      { "@type": "PropertyValue", name: "Power", value: `${product.powerW} W` },
    ],
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: String(product.priceUSDT),
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/PreOrder",
      priceValidUntil: PRICE_VALID_UNTIL,
      url: productUrl,
      seller: { "@type": "Organization", name: "TradeM" },
      // Nova Poshta across Ukraine; pre-order units ship from China in 10–14 days
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "UA" },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: product.inStock ? 0 : 10,
            maxValue: product.inStock ? 1 : 14,
            unitCode: "DAY",
          },
          transitTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 3, unitCode: "DAY" },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "UA",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 14,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
      },
    },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: hub && hubUrl
      ? [
          { "@type": "ListItem", position: 1, name: t("breadcrumbHome"), item: `${SITE_URL}${localePrefix}/` },
          { "@type": "ListItem", position: 2, name: t("breadcrumbProducts"), item: `${SITE_URL}${localePrefix}/products` },
          { "@type": "ListItem", position: 3, name: hub.label, item: hubUrl },
          { "@type": "ListItem", position: 4, name: product.name, item: productUrl },
        ]
      : [
          { "@type": "ListItem", position: 1, name: t("breadcrumbHome"), item: `${SITE_URL}${localePrefix}/` },
          { "@type": "ListItem", position: 2, name: t("breadcrumbProducts"), item: `${SITE_URL}${localePrefix}/products` },
          { "@type": "ListItem", position: 3, name: product.name, item: productUrl },
        ],
  };
  const faqLd = modelFaqs.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: modelFaqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }
    : null;
  const jsonLd = faqLd ? [productLd, breadcrumbLd, faqLd] : [productLd, breadcrumbLd];

  return (
    <div className="pb-section-gap">
      <JsonLd data={jsonLd} />

      {/* ── Hero section ── */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto pt-10 pb-16">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px] mb-10">
          <Link href="/" className="hover:text-primary transition-colors">{t("breadcrumbHome")}</Link>
          <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          <Link href="/products" className="hover:text-primary transition-colors">{t("breadcrumbProducts")}</Link>
          {hub && (
            <>
              <span className="material-symbols-outlined text-[12px]">chevron_right</span>
              <Link href={`/asic/${hub.slug}`} className="hover:text-primary transition-colors">{hub.label}</Link>
            </>
          )}
          <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          <span className="text-on-surface truncate max-w-[220px] uppercase">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16 items-start">

          {/* Image, price, CTA, batch selector + hashrate config selector +
              mini calc (client) — batch siblings are the same physical unit,
              so switching between them is a client-side price/stock swap,
              not a navigation. */}
          <ProductHero
            product={product}
            batches={batches.map((b) => ({
              id: b.id,
              batch: b.batch as BatchMonth,
              priceUSDT: b.priceUSDT,
              inStock: b.inStock,
            }))}
            descKey={descKey}
            configs={configs.map((c) => ({
              id: c.id,
              slug: getCanonicalSlug(c),
              hashrate: c.hashrate,
              powerW: c.powerW,
              priceUSDT: c.priceUSDT,
              inStock: c.inStock,
            }))}
            revenuePerTH={revenuePerTH}
            usdUah={usdUah}
          />
        </div>
      </section>

      {/* ── Trust strip ── */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-16">
        <TrustBar />
      </section>

      {/* ── Tech specs ── */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-16">
        <div className="head-rule mb-6">
          <div className="line" />
          <h2 className="font-headline-md text-headline-md gold-text uppercase tracking-widest whitespace-nowrap text-base">
            {t("specsSectionTitle")}
          </h2>
          <div className="line" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {specs.map((s) => (
            <div key={s.label} className="glass glass-hover p-5 flex flex-col gap-2">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">
                {s.label}
              </span>
              <span className="font-technical-data text-technical-data gold-text text-base">
                {s.value}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── About this model (curated SEO copy + FAQ) ── */}
      {modelKey && (
        <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-16">
          <div className="head-rule mb-8">
            <div className="line" />
            <h2 className="font-headline-md text-headline-md gold-text uppercase tracking-widest whitespace-nowrap text-base">
              {t("modelAboutHeading")}
            </h2>
            <div className="line" />
          </div>
          <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed max-w-3xl">
            {t(`model${modelKey}Body`)}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start mt-8">
            {modelFaqs.map((f) => (
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

      {/* ── Similar models ── */}
      {similar.length > 0 && (
        <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
          <div className="head-rule mb-8">
            <div className="line" />
            <h2 className="font-headline-md text-headline-md gold-text uppercase tracking-widest whitespace-nowrap text-base">
              {t("similarModelsHeading")}
            </h2>
            <div className="line" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
            {similar.map((p) => {
              const simImg = getProductImage(p.name, p.imageUrl);
              return (
              <Link
                key={p.id}
                href={`/products/${getCanonicalSlug(p)}`}
                className="glass glass-hover group overflow-hidden flex flex-col"
              >
                <div className="relative h-36 plate flex items-center justify-center overflow-hidden border-b border-white/5">
                  <div className="grid-tex" />
                  {simImg ? (
                    <Image src={simImg} alt={p.name} fill sizes="(max-width: 640px) 50vw, 200px" className="relative z-10 object-contain p-3 group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <span className="material-symbols-outlined text-outline-variant group-hover:text-primary/40 transition-colors text-[48px] relative z-10">memory</span>
                  )}
                  <span className={`absolute top-2 left-2 z-20 chip px-2 py-0.5 text-[9px] font-technical-data uppercase ${p.inStock ? "!bg-green-400/10 !border-green-400/30 !text-green-400" : ""}`}>
                    {p.inStock ? t("similarInStock") : t("similarOnOrder")}
                  </span>
                </div>
                <div className="p-4 border-t border-white/5 flex flex-col gap-1 flex-1">
                  <span className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest">{p.algorithm}</span>
                  <h3 className="font-technical-data text-technical-data text-on-surface text-sm leading-snug">{p.name}</h3>
                  <p className="font-headline-md text-headline-md gold-text mt-auto pt-2 text-base">
                    ${p.priceUSDT.toLocaleString()}
                  </p>
                </div>
              </Link>
              );
            })}
          </div>

          <div className="flex justify-center mt-10">
            <Link href="/products" className="btn-ghost py-3 px-8 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center gap-2 text-xs">
              <span className="material-symbols-outlined text-[16px]">grid_view</span>
              {t("allCatalog")}
            </Link>
          </div>
        </section>
      )}

    </div>
  );
}
