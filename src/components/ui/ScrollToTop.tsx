"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export default function ScrollToTop() {
  const t = useTranslations("common");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label={t("scrollToTopAria")}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-6 right-6 z-50 w-9 h-9 rounded-full bg-card border border-[#2e2d2b] text-on-surface-variant hover:border-primary hover:text-primary transition-all duration-300 flex items-center justify-center shadow-lg ${
        visible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-2 pointer-events-none"
      }`}
    >
      <span className="material-symbols-outlined text-[18px]">keyboard_arrow_up</span>
    </button>
  );
}
