"use client";

import type { ReactNode } from "react";

// Small hover tooltip — pure CSS reveal (opacity/scale on :hover and
// :focus-within), same spirit as the rest of the site's motion (no
// click-state, nothing "expands"). focus-within covers keyboard use and
// most mobile browsers, which focus a button on tap.
export default function InfoTooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="relative inline-flex group">
      <button
        type="button"
        aria-label={label}
        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-on-surface-variant/40 text-on-surface-variant hover:border-primary hover:text-primary transition-colors shrink-0"
      >
        <span className="material-symbols-outlined text-[10px] leading-none">info</span>
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute z-30 bottom-full right-0 mb-1.5 w-max max-w-[180px] px-2 py-1.5 rounded-md text-[11px] leading-snug text-on-surface-variant bg-surface-container border border-outline-variant/30 opacity-0 scale-95 origin-bottom-right transition-all duration-150 group-hover:opacity-100 group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:scale-100"
      >
        {children}
      </span>
    </span>
  );
}
