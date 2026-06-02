"use client";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LABELS: Record<string, string> = { uk: "UA", en: "EN" };

export default function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex items-center gap-1 font-label-caps text-label-caps uppercase tracking-widest text-xs">
      {routing.locales.map((loc) => (
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
