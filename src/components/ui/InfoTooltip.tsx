"use client";

import { useState, type ReactNode } from "react";

// Small click-to-toggle info popover — works on touch (unlike a hover-only
// tooltip). Used next to badges/labels whose meaning needs a short caveat
// (e.g. the calculator's "Live" price badge).
export default function InfoTooltip({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-on-surface-variant/40 text-on-surface-variant hover:border-primary hover:text-primary transition-colors shrink-0"
      >
        <span className="material-symbols-outlined text-[11px] leading-none">info</span>
      </button>
      {open && (
        <span
          role="tooltip"
          className="glass absolute z-30 top-full right-0 mt-2 w-56 p-3 text-left rounded-lg text-xs leading-relaxed text-on-surface-variant"
        >
          {children}
        </span>
      )}
    </span>
  );
}
