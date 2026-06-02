import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import JsonLd from "@/components/seo/JsonLd";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("servicesTitle"),
    description: t("servicesDescription"),
    alternates: { languages: { uk: "/services", en: "/en/services", "x-default": "/services" } },
  };
}

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("services");

  const SERVICES = [
    {
      icon: "build",
      title: t("service1Title"),
      short: t("service1Short"),
      desc: t("service1Desc"),
      items: [
        t("service1Item1"),
        t("service1Item2"),
        t("service1Item3"),
        t("service1Item4"),
        t("service1Item5"),
        t("service1Item6"),
      ],
      price: t("service1Price"),
      time: t("service1Time"),
    },
    {
      icon: "settings",
      title: t("service2Title"),
      short: t("service2Short"),
      desc: t("service2Desc"),
      items: [
        t("service2Item1"),
        t("service2Item2"),
        t("service2Item3"),
        t("service2Item4"),
        t("service2Item5"),
        t("service2Item6"),
      ],
      price: t("service2Price"),
      time: t("service2Time"),
    },
    {
      icon: "warehouse",
      title: t("service3Title"),
      short: t("service3Short"),
      desc: t("service3Desc"),
      items: [
        t("service3Item1"),
        t("service3Item2"),
        t("service3Item3"),
        t("service3Item4"),
        t("service3Item5"),
        t("service3Item6"),
      ],
      price: t("service3Price"),
      time: t("service3Time"),
    },
  ];

  const FAQ = [
    { q: t("faq1Q"), a: t("faq1A") },
    { q: t("faq2Q"), a: t("faq2A") },
    { q: t("faq3Q"), a: t("faq3A") },
    { q: t("faq4Q"), a: t("faq4A") },
    { q: t("faq5Q"), a: t("faq5A") },
    { q: t("faq6Q"), a: t("faq6A") },
    { q: t("faq7Q"), a: t("faq7A") },
    { q: t("faq8Q"), a: t("faq8A") },
  ];

  // FAQPage structured data — mirrors the visible FAQ section below
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="pb-section-gap">
      <JsonLd data={faqLd} />

      {/* Hero */}
      <section className="relative py-24 px-margin-mobile md:px-margin-desktop overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        </div>
        <div className="max-w-container-max mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-8 bg-primary" />
            <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest">
              {t("heroLabel")}
            </span>
          </div>
          <h1 className="font-display-lg text-display-lg text-on-surface uppercase leading-none mb-6">
            {t("heroTitle1")} <span className="gold-text">{t("heroTitle2")}</span>
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
            {t("heroBody")}
          </p>
        </div>
      </section>

      {/* Services cards */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-section-gap">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {SERVICES.map((s) => (
            <div key={s.title} className="glass glass-hover p-8 flex flex-col gap-5 cursor-default">
              <div className="flex items-start gap-4">
                <span className="grid place-items-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 shrink-0">
                  <span className="material-symbols-outlined text-primary text-[28px]">{s.icon}</span>
                </span>
                <div className="min-w-0">
                  <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest mb-1 break-words hyphens-auto">
                    {s.title}
                  </h2>
                  <p className="font-label-caps text-[10px] text-primary uppercase tracking-widest break-words">{s.short}</p>
                </div>
              </div>

              <p className="font-body-md text-body-md text-on-surface-variant text-sm leading-relaxed">
                {s.desc}
              </p>

              <ul className="space-y-2 flex-1">
                {s.items.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary text-[14px] mt-0.5 shrink-0">check_circle</span>
                    <span className="font-body-md text-body-md text-on-surface-variant text-sm min-w-0 break-words">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="border-t border-white/8 pt-4 flex flex-wrap justify-between items-center gap-3">
                <div className="min-w-0">
                  <p className="font-label-caps text-label-caps gold-text uppercase tracking-widest break-words">{s.price}</p>
                  <p className="font-label-caps text-label-caps text-on-surface-variant text-[10px] uppercase tracking-wider break-words">{s.time}</p>
                </div>
                <Link href="/contact" className="btn-ghost px-4 py-2 rounded font-label-caps text-label-caps uppercase tracking-widest text-xs flex items-center gap-1 shrink-0">
                  {t("orderButton")}
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-section-gap">
        <div className="head-rule mb-10">
          <div className="line" />
          <h2 className="font-headline-md text-headline-md gold-text uppercase tracking-widest whitespace-nowrap">
            {t("faqHeading")}
          </h2>
          <div className="line" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {FAQ.map((item) => (
            <details key={item.q} className="faq glass p-5 group">
              <summary className="flex items-center justify-between gap-4 cursor-pointer">
                <h3 className="font-headline-md text-headline-md text-on-surface text-base leading-snug min-w-0 break-words">{item.q}</h3>
                <span className="material-symbols-outlined chev text-primary text-[20px] shrink-0">expand_more</span>
              </summary>
              <p className="font-body-md text-body-md text-on-surface-variant text-sm mt-3">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="glass p-8 md:p-12 text-center relative overflow-hidden">
          <div className="grid-tex" />
          <div className="relative z-10 space-y-4">
            <h2 className="font-headline-md text-headline-md gold-text uppercase tracking-widest">
              {t("ctaHeading")}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-lg mx-auto">
              {t("ctaBody")}
            </p>
            <div className="flex flex-wrap gap-4 justify-center pt-2">
              <Link href="/contact" className="btn-primary py-4 px-8 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-transform">
                <span className="material-symbols-outlined text-[18px]">contact_support</span>
                {t("ctaContact")}
              </Link>
              <Link href="/products" className="btn-ghost py-4 px-8 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                {t("ctaCatalog")}
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
