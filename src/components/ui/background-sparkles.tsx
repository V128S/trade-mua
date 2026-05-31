"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";

// Load the heavy tsparticles core lazily and client-only, so it stays out of
// the critical JS path (P0 performance win — the particles are purely ambient).
const SparklesCore = dynamic(
  () => import("./sparkles").then((m) => m.SparklesCore),
  { ssr: false }
);

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => obs.disconnect();
}
function getTheme() {
  return document.documentElement.classList.contains("light") ? "light" : "dark";
}

export default function BackgroundSparkles() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "dark" as const);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Honor reduced-motion: skip the animation entirely.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    // Defer mounting the particle engine until the browser is idle, so it never
    // competes with first paint / hydration / interactivity.
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => setReady(true));
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(() => setReady(true), 200);
    return () => window.clearTimeout(id);
  }, []);

  if (!ready) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden>
      <SparklesCore
        id="bg-sparkles"
        background="transparent"
        minSize={0.4}
        maxSize={1.2}
        speed={1}
        particleColor={theme === "dark" ? "#ecc246" : "#c9a227"}
        particleDensity={theme === "dark" ? 24 : 16}
        className="w-full h-full"
      />
    </div>
  );
}
