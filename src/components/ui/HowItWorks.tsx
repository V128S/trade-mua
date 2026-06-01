import { getTranslations } from "next-intl/server";

// "Як ми працюємо" — makes the order-as-request flow transparent so submitting a
// request doesn't feel like a leap of faith. Renders just the 4-step grid; the
// caller supplies the surrounding heading so it fits both the home page and the
// checkout page. Server component: pure i18n.
export default async function HowItWorks() {
  const t = await getTranslations("howItWorks");

  const steps = [
    { icon: "forum", title: t("step1Title"), desc: t("step1Desc") },
    { icon: "description", title: t("step2Title"), desc: t("step2Desc") },
    { icon: "payments", title: t("step3Title"), desc: t("step3Desc") },
    { icon: "local_shipping", title: t("step4Title"), desc: t("step4Desc") },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
      {steps.map((s, i) => (
        <div
          key={s.title}
          className="glass glass-hover p-6 flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <span className="material-symbols-outlined text-primary text-[28px]">{s.icon}</span>
            <span className="font-display-lg text-[34px] leading-none text-outline-variant/25">
              0{i + 1}
            </span>
          </div>
          <h3 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest text-base">
            {s.title}
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant text-sm leading-relaxed">
            {s.desc}
          </p>
        </div>
      ))}
    </div>
  );
}
