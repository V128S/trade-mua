"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function NavigationProgress() {
  const pathname = usePathname();
  const [width, setWidth]   = useState(0);
  const [visible, setVisible] = useState(false);

  const interval = useRef<ReturnType<typeof setInterval>>(undefined);
  const timeout  = useRef<ReturnType<typeof setTimeout>>(undefined);
  const mounted  = useRef(false);

  const clear = () => {
    clearInterval(interval.current);
    clearTimeout(timeout.current);
  };

  const start = () => {
    clear();
    setVisible(true);
    setWidth(12);
    let w = 12;
    interval.current = setInterval(() => {
      // Decelerates as it approaches 85 — never reaches 100 until complete
      w += (85 - w) * 0.12;
      setWidth(w);
    }, 200);
  };

  const complete = () => {
    clear();
    setWidth(100);
    timeout.current = setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 380);
  };

  // Listen for link clicks to start the bar
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a");
      if (!a) return;
      const href = a.getAttribute("href") ?? "";
      // Skip external, hash, and same-page links
      if (!href || href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto") || href.startsWith("tel")) return;
      // Skip if already on that page
      if (href === pathname || href === window.location.pathname) return;
      start();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Complete when route actually changes
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    complete();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => () => clear(), []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 z-[9999] h-[2px] pointer-events-none"
      style={{
        width: `${width}%`,
        background: "#ecc246",
        boxShadow: "0 0 8px 1px rgba(236,194,70,0.55)",
        transition: width === 100
          ? "width 0.25s ease-out"
          : "width 0.2s linear",
      }}
    />
  );
}
