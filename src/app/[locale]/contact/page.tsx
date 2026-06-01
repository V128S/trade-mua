import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("contactTitle"),
    description: t("contactDescription"),
    alternates: { languages: { uk: "/contact", ru: "/ru/contact", "x-default": "/contact" } },
  };
}

const VALUE_ICONS = ["verified", "speed", "support_agent", "lock"];

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");
  const ta = await getTranslations("about");

  const STATS = [
    { value: ta("stat1Value"), label: ta("stat1Label") },
    { value: ta("stat2Value"), label: ta("stat2Label") },
    { value: ta("stat3Value"), label: ta("stat3Label") },
    { value: ta("stat4Value"), label: ta("stat4Label") },
  ];

  const VALUES = [
    { icon: VALUE_ICONS[0], title: ta("value1Title"), desc: ta("value1Desc") },
    { icon: VALUE_ICONS[1], title: ta("value2Title"), desc: ta("value2Desc") },
    { icon: VALUE_ICONS[2], title: ta("value3Title"), desc: ta("value3Desc") },
    { icon: VALUE_ICONS[3], title: ta("value4Title"), desc: ta("value4Desc") },
  ];

  return (
    <div className="pb-section-gap">

      {/* Hero */}
      <section className="relative py-20 px-margin-mobile md:px-margin-desktop overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />
        </div>
        <div className="max-w-container-max mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-8 bg-primary" />
            <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest">{t("heroLabel")}</span>
          </div>
          <h1 className="font-display-lg text-display-lg text-on-surface uppercase leading-none mb-4">
            {t("heroTitle")}
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg">
            {t("heroBody")}
          </p>
        </div>
      </section>

      {/* About — story + stats */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-section-gap">
        <div className="flex items-center gap-4 mb-10">
          <div className="h-px bg-outline-variant flex-1" />
          <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest whitespace-nowrap">{t("aboutHeading")}</h2>
          <div className="h-px bg-outline-variant flex-1" />
        </div>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl mx-auto text-center mb-12">
          {ta("heroBody")}
        </p>
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
          <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest whitespace-nowrap">{ta("valuesHeading")}</h2>
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

      {/* Contacts grid */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-section-gap">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-px bg-outline-variant flex-1" />
          <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest whitespace-nowrap">{t("heroLabel")}</h2>
          <div className="h-px bg-outline-variant flex-1" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">

          {/* Phone */}
          <a
            href="tel:+380974225060"
            className="bg-card border-card rounded-lg p-8 flex flex-col gap-5 hover-primary-border transition-colors duration-300 group"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[28px]">phone</span>
              <p className="font-label-caps text-sm text-on-surface-variant uppercase tracking-widest group-hover:text-primary transition-colors">{t("phoneLabel")}</p>
            </div>
            <div>
              <p className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors">
                {t("phoneNumber")}
              </p>
              <p className="font-technical-data text-technical-data text-on-surface-variant mt-1">
                {t("phoneDesc")}
              </p>
            </div>
          </a>

          {/* Telegram */}
          <a
            href="https://t.me/BOSSDnepra"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-card border-card rounded-lg p-8 flex flex-col gap-5 hover-primary-border transition-colors duration-300 group"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[28px]">send</span>
              <p className="font-label-caps text-sm text-on-surface-variant uppercase tracking-widest group-hover:text-primary transition-colors">{t("telegramLabel")}</p>
            </div>
            <div>
              <p className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors">
                {t("telegramHandle")}
              </p>
              <p className="font-technical-data text-technical-data text-on-surface-variant mt-1">
                {t("telegramDesc")}
              </p>
            </div>
          </a>

          {/* Telegram channel (informational) */}
          <a
            href="https://t.me/TRADEM_UA"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-card border-card rounded-lg p-8 flex flex-col gap-5 hover-primary-border transition-colors duration-300 group"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[28px]">campaign</span>
              <p className="font-label-caps text-sm text-on-surface-variant uppercase tracking-widest group-hover:text-primary transition-colors">{t("channelLabel")}</p>
            </div>
            <div>
              <p className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors">
                {t("channelHandle")}
              </p>
              <p className="font-technical-data text-technical-data text-on-surface-variant mt-1">
                {t("channelDesc")}
              </p>
            </div>
          </a>

          {/* Working hours */}
          <a
            href="https://t.me/BOSSDnepra"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-card border-card rounded-lg p-8 flex flex-col gap-5 hover-primary-border transition-colors duration-300 group"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[28px]">schedule</span>
              <p className="font-label-caps text-sm text-on-surface-variant uppercase tracking-widest group-hover:text-primary transition-colors">{t("hoursLabel")}</p>
            </div>
            <div>
              <p className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors">
                {t("hoursValue")}
              </p>
              <p className="font-technical-data text-technical-data text-on-surface-variant mt-1">
                {t("hoursDesc")}
              </p>
            </div>
          </a>
        </div>
      </section>

      {/* Offices */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-section-gap">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-px bg-outline-variant flex-1" />
          <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest whitespace-nowrap">{t("officesHeading")}</h2>
          <div className="h-px bg-outline-variant flex-1" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
          {[
            { city: t("office1City"), desc: t("office1Desc"), address: t("office1Address"), mapQuery: "Butyshiv Ln 19, Kyiv, 01010", hasMap: false },
            { city: t("office2City"), desc: t("office2Desc"), address: t("office2Address"), mapQuery: "Kosmichna St 19, Dnipro, 49000", hasMap: true },
          ].map((o) => (
            <div key={o.city} className="bg-card border-card rounded-lg overflow-hidden flex flex-col">
              <div className="p-6 flex gap-4">
                <span className="material-symbols-outlined text-primary text-[28px] shrink-0">location_on</span>
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface text-base uppercase tracking-widest mb-1">{o.city}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant text-sm">{o.desc}</p>
                  <p className="font-technical-data text-technical-data text-on-surface text-sm mt-2">{o.address}</p>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(o.mapQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-3 font-label-caps text-label-caps text-primary uppercase tracking-widest text-[10px] hover:text-secondary transition-colors"
                  >
                    {t("mapDirections")}
                    <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                  </a>
                </div>
              </div>
              {o.hasMap && (
                <iframe
                  src={`https://www.google.com/maps?q=${encodeURIComponent(o.mapQuery)}&hl=uk&output=embed`}
                  title={`${o.city} — ${o.address}`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-56 border-0 grayscale-[0.3] contrast-[1.1] mt-auto"
                  allowFullScreen
                />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Quick actions */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <Link href="/products" className="w-full btn-ghost py-4 px-6 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[18px]">inventory_2</span>
            {t("quickCatalog")}
          </Link>
          <Link href="/calculator" className="w-full btn-ghost py-4 px-6 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[18px]">calculate</span>
            {t("quickCalculator")}
          </Link>
        </div>
      </section>

    </div>
  );
}
