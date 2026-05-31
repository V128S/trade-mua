// src/components/products/ProductsMobileDrawer.tsx
"use client";
import { useEffect, type ReactNode } from "react";
import { useTranslations } from "next-intl";

interface ProductsMobileDrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function ProductsMobileDrawer({ open, onClose, children }: ProductsMobileDrawerProps) {
  const t = useTranslations("products");

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Overlay */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("drawerTitle")}
        className={`fixed inset-x-0 bottom-0 z-50 h-[85vh] rounded-t-2xl bg-card border-t border-card-border transition-transform duration-300 ease-out lg:hidden flex flex-col ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-card-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-card-border shrink-0">
          <span className="font-headline-md text-[16px] text-on-surface">{t("drawerTitle")}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("drawerCloseAria")}
            className="text-on-surface-variant hover:text-on-surface transition-colors p-1"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-5 pb-8">
          {children}
        </div>
      </div>
    </>
  );
}
