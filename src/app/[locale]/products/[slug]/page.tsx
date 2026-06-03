import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { getProductsFromDB } from "@/lib/products";
import ProductDetail from "@/components/products/ProductDetail";
import { getProductImage } from "@/lib/product-images";
import { getMinerstatRevenue } from "@/lib/minerstat";
import { getModelContentKey } from "@/lib/model-content";
import AddToCartButton from "@/components/cart/AddToCartButton";
import JsonLd from "@/components/seo/JsonLd";
import TrustBar from "@/components/ui/TrustBar";
import { getTranslations, setRequestLocale } from "next-intl/server";

export const revalidate = 60;

const SITE_URL = "https://trade-mua.vercel.app";

// Offer needs a future priceValidUntil. Computed once at module load (refreshes
// on each deploy/ISR rebuild) so it isn't an impure call during render.
const PRICE_VALID_UNTIL = new Date(Date.now() + 365 * 86400000)
  .toISOString()
  .slice(0, 10);

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


type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const [products, t] = await Promise.all([
    getProductsFromDB(),
    getTranslations({ locale, namespace: "products" }),
  ]);
  const product = products.find((p) => p.id === slug);
  if (!product) return { title: "TradeM" };
  const path = `/products/${slug}`;
  return {
    title: t("metaSlugTitle", { name: product.name }),
    description: t("metaSlugDescription", {
      name: product.name,
      hashrate: product.hashrate,
      power: product.powerW,
    }),
    alternates: { languages: { uk: path, en: `/en${path}`, ru: `/ru${path}`, "x-default": path } },
  };
}

export default async function ProductPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("products");

  const [products, revenueMap] = await Promise.all([getProductsFromDB(), getMinerstatRevenue()]);

  const product = products.find((p) => p.id === slug);
  if (!product) notFound();

  // Revenue for this product's specific algorithm
  const algoData = revenueMap[product.algorithm] ?? revenueMap["SHA256"];
  const revenuePerTH = algoData?.revenuePerTH ?? 0;

  const baseName = getBaseName(product.name);
  const cooling = getCooling(product.name);

  // All configurations = same base name, sorted by hashrate desc
  const configs = products
    .filter((p) => getBaseName(p.name) === baseName)
    .sort((a, b) => b.priceUSDT - a.priceUSDT);

  // Similar models = same algorithm, different base name, max 4
  const similar = products
    .filter((p) => p.algorithm === product.algorithm && getBaseName(p.name) !== baseName)
    .slice(0, 4);

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
  const productUrl = `${SITE_URL}${localePrefix}/products/${product.id}`;
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
    },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
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
          <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          <span className="text-on-surface truncate max-w-[220px] uppercase">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16 items-start">

          {/* Left — product image */}
          {(() => {
            const imgSrc = getProductImage(product.name, product.imageUrl);
            return (
              <div className="relative glass overflow-hidden aspect-square flex items-center justify-center">
                <div className="grid-tex" />
                {imgSrc ? (
                  <Image
                    src={imgSrc}
                    alt={product.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    className="relative z-10 object-contain p-8 drop-shadow-2xl"
                    priority
                  />
                ) : (
                  <span className="material-symbols-outlined text-outline-variant text-[120px] relative z-10">memory</span>
                )}
                <div className="absolute top-4 left-4 flex gap-2 z-20">
                  {product.isNew && (
                    <span className="chip px-2 py-1 font-technical-data text-[10px] uppercase tracking-wider">{t("badgeNew")}</span>
                  )}
                  {product.inStock ? (
                    <span className="chip px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider inline-flex items-center gap-1 !bg-green-400/10 !border-green-400/30 !text-green-400">
                      <span className="material-symbols-outlined text-[12px]">check_circle</span>
                      {t("inStock")}
                    </span>
                  ) : (
                    <span className="chip px-2 py-1 font-technical-data text-[10px] uppercase tracking-wider">{t("onOrder")}</span>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Right — details */}
          <div className="flex flex-col gap-0">
            {/* Algorithm label */}
            <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest text-[11px]">
              {product.algorithm}
            </span>

            {/* Name */}
            <h1 className="font-headline-lg text-headline-lg text-on-surface mt-2 leading-tight">
              {product.name.replace(/\s*\d[\d.,]*\s*(?:TH\/s|GH\/s|MH\/s|Th|Gh|Mh|T|G|M)\s*$/i, "").trim()}
              {product.hashrate && (
                <span className="text-on-surface-variant ml-2 font-normal">{product.hashrate}</span>
              )}
            </h1>

            {/* Description */}
            <p className="font-body-md text-body-md text-on-surface-variant mt-3 max-w-md">
              {t(descKey)}
            </p>

            {/* Price */}
            <div className="mt-6">
              <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">
                {product.inStock ? t("priceLabelInStock") : t("priceLabelOnOrder")}
              </p>
              <p className="font-display-lg text-[52px] leading-none gold-text">
                ${product.priceUSDT.toLocaleString()}
              </p>
              <p className="font-label-caps text-[10px] text-on-surface-variant mt-1">{t("priceCurrency")}</p>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap gap-3 mt-6">
              <AddToCartButton product={product} />
              <Link href="/contact" className="btn-ghost py-4 px-8 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">contact_support</span>
                {t("consultButton")}
              </Link>
            </div>

            {/* Config selector + mini calculator (client) */}
            <ProductDetail
              product={product}
              configs={configs.map((c) => ({
                id: c.id,
                hashrate: c.hashrate,
                powerW: c.powerW,
                priceUSDT: c.priceUSDT,
                inStock: c.inStock,
              }))}
              revenuePerTH={revenuePerTH}
            />
          </div>
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
                href={`/products/${p.id}`}
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
