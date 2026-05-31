import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("aboutTitle"),
    description: t("aboutDescription"),
    alternates: { languages: { uk: "/about", ru: "/ru/about", "x-default": "/about" } },
  };
}

const VALUE_ICONS = ["verified", "speed", "support_agent", "lock"];

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");

  const STATS = [
    { value: t("stat1Value"), label: t("stat1Label") },
    { value: t("stat2Value"), label: t("stat2Label") },
    { value: t("stat3Value"), label: t("stat3Label") },
    { value: t("stat4Value"), label: t("stat4Label") },
  ];

  const VALUES = [
    { icon: VALUE_ICONS[0], title: t("value1Title"), desc: t("value1Desc") },
    { icon: VALUE_ICONS[1], title: t("value2Title"), desc: t("value2Desc") },
    { icon: VALUE_ICONS[2], title: t("value3Title"), desc: t("value3Desc") },
    { icon: VALUE_ICONS[3], title: t("value4Title"), desc: t("value4Desc") },
  ];

  return (
    <div className="pb-section-gap">

      {/* Hero */}
      <section className="relative py-24 px-margin-mobile md:px-margin-desktop overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{ backgroundImage: "radial-gradient(#ecc246 1px, transparent 1px)", backgroundSize: "24px 24px" }}
          />
        </div>
        <div className="max-w-container-max mx-auto relative z-10 max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-8 bg-primary" />
            <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest">{t("heroLabel")}</span>
          </div>
          <h1 className="font-display-lg text-display-lg text-on-surface uppercase leading-none mb-6">
            {t("heroTitle")} <span className="text-primary">{t("heroTitleHighlight")}</span>
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            {t("heroBody")}
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-section-gap">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="bg-card border-card rounded-lg p-6 text-center">
              <p className="font-display-lg text-[40px] leading-none text-primary mb-2">{s.value}</p>
              <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-section-gap">
        <div className="flex items-center gap-4 mb-10">
          <div className="h-px bg-outline-variant flex-1" />
          <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest whitespace-nowrap">{t("valuesHeading")}</h2>
          <div className="h-px bg-outline-variant flex-1" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-gutter">
          {VALUES.map((v) => (
            <div key={v.title} className="bg-card border-card rounded-lg p-8 flex gap-5">
              <span className="material-symbols-outlined text-primary text-[28px] shrink-0 mt-1">{v.icon}</span>
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface text-base uppercase tracking-widest mb-2">{v.title}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/products" className="btn-primary py-4 px-8 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-[18px]">inventory_2</span>
            {t("ctaCatalog")}
          </Link>
          <Link href="/contact" className="btn-ghost py-4 px-8 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">contact_support</span>
            {t("ctaContact")}
          </Link>
        </div>
      </section>

    </div>
  );
}
