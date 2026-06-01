import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import CallbackForm from "@/components/contact/CallbackForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("contactTitle"),
    description: t("contactDescription"),
    alternates: { languages: { uk: "/contact", ru: "/ru/contact", "x-default": "/contact" } },
  };
}

const DNIPRO_MAP_QUERY = "Kosmichna St 19, Dnipro, 49000";

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");

  const CONTACT_CARDS = [
    { icon: "phone", label: t("phoneLabel"), value: t("phoneNumber"), href: "tel:+380974225060", external: false },
    { icon: "send", label: t("telegramLabel"), value: t("telegramHandle"), href: "https://t.me/BOSSDnepra", external: true },
    { icon: "campaign", label: t("channelLabel"), value: t("channelHandle"), href: "https://t.me/TRADEM_UA", external: true },
    { icon: "schedule", label: t("hoursLabel"), value: t("hoursValue"), href: "https://t.me/BOSSDnepra", external: true },
  ];

  const OFFICES = [
    { city: t("office1City"), address: t("office1Address") },
    { city: t("office2City"), address: t("office2Address") },
  ];

  return (
    <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto pt-16 pb-section-gap">

      {/* Hero — centered */}
      <section className="text-center mb-14">
        <div className="flex items-center justify-center gap-3 mb-5">
          <div className="h-px w-8 bg-primary" />
          <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest">{t("heroLabel")}</span>
          <div className="h-px w-8 bg-primary" />
        </div>
        <h1 className="font-display-lg text-display-lg text-on-surface uppercase leading-none">
          {t("heroTitleLead")} <span className="gold-text">{t("heroTitleAccent")}</span>
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg mx-auto mt-6">
          {t("heroBody")}
        </p>
      </section>

      {/* Contact cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-gutter mb-gutter">
        {CONTACT_CARDS.map((c) => (
          <a
            key={c.label}
            href={c.href}
            {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="glass glass-hover p-6 flex flex-col items-center text-center gap-3 group"
          >
            <span className="grid place-items-center w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20">
              <span className="material-symbols-outlined text-primary text-[22px]">{c.icon}</span>
            </span>
            <div>
              <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px] mb-1.5">{c.label}</p>
              <p className="font-technical-data text-technical-data text-on-surface group-hover:text-primary transition-colors">{c.value}</p>
            </div>
          </a>
        ))}
      </section>

      {/* Form + offices/hours */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-gutter mt-gutter">
        <CallbackForm
          labels={{
            heading: t("formHeading"),
            body: t("formBody"),
            name: t("formName"),
            phone: t("formPhone"),
            topicBuy: t("formTopicBuy"),
            topicRepair: t("formTopicRepair"),
            topicFirmware: t("formTopicFirmware"),
            topicHotel: t("formTopicHotel"),
            comment: t("formComment"),
            submit: t("formSubmit"),
            success: t("formSuccess"),
          }}
        />

        <div className="space-y-gutter">
          {/* Offices */}
          <div className="glass !rounded-2xl p-7">
            <h3 className="font-headline-md text-headline-md text-on-surface mb-5 flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-[20px]">location_on</span>
              {t("officesHeading")}
            </h3>
            <ul className="space-y-4">
              {OFFICES.map((o) => (
                <li key={o.city} className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary/70 text-[16px] mt-0.5">location_on</span>
                  <div>
                    <p className="font-technical-data text-technical-data text-on-surface">{o.city}</p>
                    <p className="font-body-md text-body-md text-on-surface-variant text-[12.5px] mt-0.5">{o.address}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Working hours */}
          <div className="glass !rounded-2xl p-7">
            <h3 className="font-headline-md text-headline-md text-on-surface mb-5 flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-[20px]">schedule</span>
              {t("hoursLabel")}
            </h3>
            <div className="space-y-3 font-technical-data text-technical-data">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">{t("scheduleWeekdays")}</span>
                <span className="text-on-surface">{t("scheduleWeekdaysTime")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">{t("scheduleSat")}</span>
                <span className="text-on-surface">{t("scheduleSatTime")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">{t("scheduleSun")}</span>
                <span className="text-on-surface-variant/60">{t("scheduleSunOff")}</span>
              </div>
              <div className="divider my-2" />
              <div className="flex items-center gap-2 text-green-400 pulse">{t("scheduleOnline")}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Dnipro map */}
      <section className="mt-gutter">
        <div className="glass !rounded-2xl overflow-hidden">
          <div className="p-7 flex items-start gap-4">
            <span className="material-symbols-outlined text-primary text-[28px] shrink-0">location_on</span>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-1">{t("office2City")}</h3>
              <p className="font-technical-data text-technical-data text-on-surface-variant">{t("office2Address")}</p>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(DNIPRO_MAP_QUERY)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-3 font-label-caps text-label-caps text-primary uppercase tracking-widest text-[10px] hover:text-secondary transition-colors"
              >
                {t("mapDirections")}
                <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
              </a>
            </div>
          </div>
          <iframe
            src={`https://www.google.com/maps?q=${encodeURIComponent(DNIPRO_MAP_QUERY)}&hl=${locale}&output=embed`}
            title={`${t("office2City")} — ${t("office2Address")}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-72 border-0 grayscale-[0.3] contrast-[1.1]"
            allowFullScreen
          />
        </div>
      </section>

    </div>
  );
}
