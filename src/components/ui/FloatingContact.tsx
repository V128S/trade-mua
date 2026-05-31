"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

// Crypto buyers want to reach a human instantly, so keep contact one tap away
// on every page. A single gold FAB that expands to the two channels we actually
// answer on: Telegram (fastest) and a phone call. Client component only for the
// open/close toggle — the actions are plain links.
const TELEGRAM_URL = "https://t.me/BOSSDnepra";
const PHONE_URL = "tel:+380974225060";

export default function FloatingContact() {
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);

  const actions = [
    { href: TELEGRAM_URL, external: true, icon: "send", label: t("contactWriteTelegram"), circle: "bg-[#229ED9] text-white" },
    { href: PHONE_URL, external: false, icon: "call", label: t("contactCall"), circle: "bg-primary-container text-[#0e0e0a]" },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
      {/* Expanded actions */}
      <div
        className={`flex flex-col items-end gap-3 transition-all duration-300 ${
          open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-3 pointer-events-none"
        }`}
      >
        {actions.map((a) => (
          <a
            key={a.icon}
            href={a.href}
            {...(a.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            onClick={() => setOpen(false)}
            className="group flex items-center gap-3 bg-card border border-[#2e2d2b] rounded-full pl-4 pr-1.5 py-1.5 shadow-lg hover:border-primary transition-colors"
          >
            <span className="font-label-caps text-label-caps uppercase tracking-widest text-[11px] text-on-surface group-hover:text-primary transition-colors whitespace-nowrap">
              {a.label}
            </span>
            <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${a.circle}`}>
              <span className="material-symbols-outlined text-[18px]">{a.icon}</span>
            </span>
          </a>
        ))}
      </div>

      {/* Main FAB */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={t("contactOpenAria")}
        className="btn-primary w-14 h-14 cursor-pointer pointer-events-auto rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
      >
        <span
          className="material-symbols-outlined text-[26px] transition-transform duration-300"
          style={{ transform: open ? "rotate(90deg)" : "none" }}
        >
          {open ? "close" : "chat"}
        </span>
      </button>
    </div>
  );
}
