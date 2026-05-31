import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getShuffledTopProductsFromDB, getRandomProductsFromDB } from "@/lib/products";
import type { Product } from "@/lib/sheets";
import { getProductImage } from "@/lib/product-images";
import HeroCarousel from "@/components/hero/HeroCarousel";
import BrandTicker from "@/components/ui/BrandTicker";
import { getTranslations, setRequestLocale } from "next-intl/server";

export const revalidate = 60; // refresh every minute

function ProductCard({ product, t }: { product: Product; t: Awaited<ReturnType<typeof getTranslations<"home">>> }) {
  const imgSrc = getProductImage(product.name);
  return (
    <Link href={`/products/${product.id}`} className="group bg-card border-card rounded-lg overflow-hidden hover-primary-border transition-colors duration-300 flex flex-col">
      <div className="relative h-44 bg-white flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/30" />
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={product.name}
            width={160}
            height={160}
            className="relative z-10 object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <span className="material-symbols-outlined text-outline-variant group-hover:text-primary/40 transition-colors text-[64px] relative z-10">
            memory
          </span>
        )}
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2 z-20">
          {product.isNew && (
            <span className="chip px-2 py-0.5 font-technical-data text-[10px] uppercase tracking-wider">
              {t("productBadgeNew")}
            </span>
          )}
          <span className={`chip px-2 py-0.5 font-technical-data text-[10px] uppercase tracking-wider ${product.inStock ? "bg-[#1a2b1a] text-green-400" : ""
            }`}>
            {product.inStock ? t("productInStock") : t("productOnOrder")}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-5 flex flex-col gap-2 border-t border-[#2e2d2b] flex-1">
        <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">
          {product.algorithm}
        </span>
        <h3 className="font-technical-data text-technical-data text-on-surface leading-snug">
          {product.name}
        </h3>
        <div className="flex gap-4 mt-1">
          {product.hashrate && (
            <span className="font-label-caps text-label-caps text-on-surface-variant">
              {product.hashrate}
            </span>
          )}
          <span className="font-label-caps text-label-caps text-on-surface-variant">
            {product.powerW} W
          </span>
        </div>
        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="font-headline-md text-headline-md text-primary">
            ${product.priceUSDT.toLocaleString()}
          </span>
          <span className="btn-ghost px-4 py-2 rounded font-label-caps text-label-caps uppercase tracking-widest text-xs transition-colors">
            {t("productDetails")}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  const TESTIMONIALS = [
    {
      name: t("testimonial1Name"),
      location: t("testimonial1Location"),
      stars: 5,
      text: t("testimonial1Text"),
    },
    {
      name: t("testimonial2Name"),
      location: t("testimonial2Location"),
      stars: 5,
      text: t("testimonial2Text"),
    },
    {
      name: t("testimonial3Name"),
      location: t("testimonial3Location"),
      stars: 5,
      text: t("testimonial3Text"),
    },
    {
      name: t("testimonial4Name"),
      location: t("testimonial4Location"),
      stars: 4,
      text: t("testimonial4Text"),
    },
  ];

  const SERVICES = [
    {
      icon: "build",
      title: t("service1Title"),
      desc: t("service1Desc"),
      back: t("service1Back"),
    },
    {
      icon: "settings",
      title: t("service2Title"),
      desc: t("service2Desc"),
      back: t("service2Back"),
    },
    {
      icon: "warehouse",
      title: t("service3Title"),
      desc: t("service3Desc"),
      back: t("service3Back"),
    },
  ];

  const [products, carouselProducts] = await Promise.all([
    getShuffledTopProductsFromDB(8),
    getRandomProductsFromDB(10),
  ]);

  return (
    <div className="pb-section-gap">

      {/* ── Hero ── */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden px-margin-mobile md:px-margin-desktop">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[100px]" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: "radial-gradient(#ecc246 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
        </div>

        <div className="max-w-container-max mx-auto w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10 xl:gap-16 items-center">

            {/* Left — text */}
            <div className="max-w-2xl space-y-8">
              {/* Label */}
              <div className="flex items-center gap-3">
                <div className="h-px w-8 bg-primary" />
                <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest">
                  {t("heroLabel")}
                </span>
              </div>

              {/* Headline */}
              <h1 className="font-display-lg text-display-lg text-on-surface uppercase leading-none">
                {t("heroTitle1")}{" "}
                <span className="text-primary">ASIC</span>
                <br />
                {t("heroTitle2")}
              </h1>

              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg">
                {t("heroBody")}
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-4 pt-2">
                <Link href="/products" className="btn-primary py-4 px-8 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-transform">
                  <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                  {t("heroCta1")}
                </Link>
                <Link href="/contact" className="btn-ghost py-4 px-8 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">contact_support</span>
                  {t("heroCta2")}
                </Link>
              </div>

              {/* Trust stats */}
              <div className="flex flex-wrap gap-8 pt-4 border-t border-outline-variant/30">
                {[
                  { value: "10–14", label: t("statDeliveryLabel") },
                  { value: "24/7", label: t("statSupportLabel") },
                  { value: t("statOfficesValue"), label: t("statOfficesLabel") },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="font-headline-md text-headline-md text-primary">{s.value}</div>
                    <div className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — infinite scroll carousel (desktop only) */}
            <div className="hidden lg:block">
              <HeroCarousel products={carouselProducts} />
            </div>

          </div>
        </div>
      </section>

      {/* ── Brand Ticker — smaller gap after hero ── */}
      <div className="mt-16">
        <BrandTicker />
      </div>

      {/* ── Top Products ── */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mt-section-gap">
        {/* Heading */}
        <div className="flex items-center gap-4 mb-10">
          <div className="h-px bg-outline-variant flex-1" />
          <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest whitespace-nowrap">
            {t("topModelsHeading")}
          </h2>
          <div className="h-px bg-outline-variant flex-1" />
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} t={t} />
            ))}
          </div>
        ) : (
          <p className="text-center font-body-md text-body-md text-on-surface-variant py-16">
            {t("catalogLoading")}
          </p>
        )}

        <div className="flex justify-center mt-10">
          <Link href="/products" className="btn-ghost py-3 px-8 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">grid_view</span>
            {t("allCatalog")}
          </Link>
        </div>
      </section>

      {/* ── Services ── */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mt-section-gap">
        <div className="flex items-center gap-4 mb-10">
          <div className="h-px bg-outline-variant flex-1" />
          <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest whitespace-nowrap">
            {t("servicesHeading")}
          </h2>
          <div className="h-px bg-outline-variant flex-1" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {SERVICES.map((s) => (
            <div key={s.title} className="service-flip h-[260px]">
              <div className="service-flip-inner h-full">

                {/* ── Front ── */}
                <div className="service-flip-face bg-card border border-[#2e2d2b] rounded-lg px-8 pt-8 pb-10 h-full flex flex-col items-center text-center gap-4 cursor-default">
                  <span className="material-symbols-outlined text-primary text-[32px]">{s.icon}</span>
                  <h3 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest">{s.title}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">{s.desc}</p>
                </div>

                {/* ── Back ── */}
                <div className="service-flip-face service-flip-back bg-[#1a1918] border border-primary/30 rounded-lg p-8 flex flex-col items-center justify-center gap-6 text-center">
                  <span className="material-symbols-outlined text-primary text-[40px]">{s.icon}</span>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{s.back}</p>
                  <Link
                    href="/services"
                    className="btn-primary py-2.5 px-6 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center gap-1.5 text-[11px]"
                  >
                    {t("serviceLearnMore")}
                    <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                  </Link>
                </div>

              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Calculator CTA ── */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mt-section-gap">
        <div className="bg-card border-card rounded-lg p-8 md:p-12 relative overflow-hidden">
          {/* Dot grid bg */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#ecc246 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl cursor-default">
              <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest">
                {t("calcHeading")}
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {t("calcBody")}
              </p>
            </div>
            <Link href="/calculator" className="shrink-0 btn-primary py-4 px-8 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-transform whitespace-nowrap">
              <span className="material-symbols-outlined text-[18px]">calculate</span>
              {t("calcCta")}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mt-section-gap">
        <div className="flex items-center gap-4 mb-10">
          <div className="h-px bg-outline-variant flex-1" />
          <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest whitespace-nowrap">
            {t("testimonialsHeading")}
          </h2>
          <div className="h-px bg-outline-variant flex-1" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
          {TESTIMONIALS.map((testimonial) => (
            <div key={testimonial.name} className="bg-card border border-[#2e2d2b] rounded-lg p-6 flex flex-col gap-4 cursor-default">
              {/* Stars */}
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={`material-symbols-outlined text-[16px] ${i < testimonial.stars ? "text-primary" : "text-outline-variant/40"}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                ))}
              </div>
              {/* Quote */}
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed flex-1">
                &ldquo;{testimonial.text}&rdquo;
              </p>
              {/* Author */}
              <div className="border-t border-[#2e2d2b] pt-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <span className="font-headline-md text-primary text-[13px]">{testimonial.name[0]}</span>
                </div>
                <div>
                  <p className="font-technical-data text-sm text-on-surface leading-tight">{testimonial.name}</p>
                  <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest mt-0.5">{testimonial.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
