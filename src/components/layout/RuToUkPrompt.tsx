"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

/**
 * Shown only on the hidden SEO-only "ru" locale: Russian-speaking searchers
 * land on /ru pages from Google, but the brand experience is Ukrainian-first.
 * Offers a one-click switch to the Ukrainian version of the current page.
 *
 * No persistence by design — it greets the visitor on each /ru entry.
 */
export default function RuToUkPrompt() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Open after mount to avoid an SSR/hydration mismatch.
  useEffect(() => {
    if (locale === "ru") setOpen(true);
  }, [locale]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (locale !== "ru" || !open) return null;

  const close = () => setOpen(false);
  const switchToUk = () => router.replace(pathname, { locale: "uk" });

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ru-uk-title"
    >
      {/* Backdrop — click to dismiss */}
      <button
        type="button"
        aria-label="Закрити"
        onClick={close}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
      />

      {/* Card */}
      <div className="relative bg-card border-card rounded-lg w-full max-w-md p-8 text-center animate-[scaleIn_0.25s_cubic-bezier(0.16,1,0.3,1)]">
        <span className="material-symbols-outlined text-primary text-[40px]">
          translate
        </span>

        <h2
          id="ru-uk-title"
          className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest mt-3"
        >
          Перейти на українську?
        </h2>

        <p className="font-body-lg text-body-lg text-on-surface-variant mt-3">
          Ви переглядаєте сайт російською. Бажаєте перейти на українську версію?
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-7">
          <button
            type="button"
            onClick={switchToUk}
            className="btn-primary flex-1 py-4 px-6 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-[18px]">check</span>
            Так, перейти
          </button>
          <button
            type="button"
            onClick={close}
            className="btn-ghost flex-1 py-4 px-6 rounded font-label-caps text-label-caps uppercase tracking-widest"
          >
            Залишитись
          </button>
        </div>
      </div>
    </div>
  );
}
