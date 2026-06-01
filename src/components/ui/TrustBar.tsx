import { getTranslations } from "next-intl/server";

// Reusable trust strip — surfaces the buying-confidence signals (official supply,
// warranty, payment options, deal safety) that matter most for high-ticket ASIC
// purchases. Server component: pure i18n, no client JS. Drop it on home, product
// detail, etc. `compact` tightens spacing for in-page placement under CTAs.
export default async function TrustBar({ compact = false }: { compact?: boolean }) {
  const t = await getTranslations("trust");

  const items = [
    { icon: "verified", title: t("officialTitle"), desc: t("officialDesc") },
    { icon: "shield", title: t("warrantyTitle"), desc: t("warrantyDesc") },
    { icon: "payments", title: t("paymentTitle"), desc: t("paymentDesc") },
    { icon: "lock", title: t("secureTitle"), desc: t("secureDesc") },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-gutter">
      {items.map((item) => (
        <div
          key={item.title}
          className={`glass glass-hover flex flex-col items-center text-center ${compact ? "gap-2.5 p-4" : "gap-3 p-5 sm:p-6"}`}
        >
          <span className="flex items-center justify-center w-11 h-11 rounded-full bg-primary/10 border border-primary/20 shrink-0">
            <span className="material-symbols-outlined text-primary text-[22px]">
              {item.icon}
            </span>
          </span>
          <div className="min-w-0">
            <p className="font-technical-data text-technical-data text-on-surface leading-tight">
              {item.title}
            </p>
            <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mt-1.5 leading-snug">
              {item.desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
