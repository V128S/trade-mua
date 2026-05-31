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
    <div
      className={`grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#2e2d2b] border-card rounded-lg overflow-hidden ${
        compact ? "" : ""
      }`}
    >
      {items.map((item) => (
        <div
          key={item.title}
          className={`bg-card flex items-start gap-3 ${compact ? "p-4" : "p-5 sm:p-6"}`}
        >
          <span className="material-symbols-outlined text-primary text-[24px] shrink-0">
            {item.icon}
          </span>
          <div className="min-w-0">
            <p className="font-technical-data text-technical-data text-on-surface leading-tight">
              {item.title}
            </p>
            <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mt-1 leading-snug">
              {item.desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
