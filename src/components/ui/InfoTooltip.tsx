"use client";

import { useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

// Small hover/focus tooltip for wrapping an existing trigger (e.g. a badge) —
// no separate icon button. Rendered through a portal into document.body so
// it's never clipped by an ancestor's `overflow: hidden` (the .glass card
// system clips its contents for its rounded-corner glow effect).
export default function InfoTooltip({ children, tooltip }: { children: ReactNode; tooltip: ReactNode }) {
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  function show() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
  }
  function hide() {
    setPos(null);
  }

  return (
    <>
      <span
        ref={triggerRef}
        tabIndex={0}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="inline-flex cursor-default"
      >
        {children}
      </span>
      {pos && typeof document !== "undefined" && createPortal(
        <span
          role="tooltip"
          style={{ position: "fixed", top: pos.top, right: pos.right }}
          className="pointer-events-none z-[999] block w-max max-w-[180px] px-2 py-1.5 rounded-md text-[11px] leading-snug text-on-surface-variant bg-surface-container border border-outline-variant/30"
        >
          {tooltip}
        </span>,
        document.body,
      )}
    </>
  );
}
