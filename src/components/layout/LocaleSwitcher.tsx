"use client";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

// Visible locales only. "ru" is intentionally omitted — it's a hidden SEO-only
// locale (real /ru pages for Google) that we don't surface as a UI choice.
const VISIBLE_LOCALES = ["uk", "en"] as const;
const LABELS: Record<string, string> = { uk: "UA", en: "EN" };

export default function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex items-center gap-1 font-label-caps text-label-caps uppercase tracking-widest text-xs">
      {VISIBLE_LOCALES.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => router.replace(pathname, { locale: loc })}
          className={loc === locale ? "text-primary" : "text-on-surface-variant hover:text-primary"}
          aria-current={loc === locale ? "true" : undefined}
        >
          {LABELS[loc]}
        </button>
      ))}
    </div>
  );
}
