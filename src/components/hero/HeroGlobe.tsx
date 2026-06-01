"use client";

import { useSyncExternalStore } from "react";
import RotatingEarth from "@/components/ui/wireframe-dotted-globe";

const DESKTOP_QUERY = "(min-width: 1024px)";
const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(query: string) {
  return (cb: () => void) => {
    const mq = window.matchMedia(query);
    mq.addEventListener("change", cb);
    return () => mq.removeEventListener("change", cb);
  };
}

// Rotating wireframe globe for the home hero (replaces the carousel/robot).
// Desktop-only (matchMedia ≥1024 — the hero column is hidden on mobile anyway),
// so the d3 bundle + geometry are never fetched on phones. Auto-rotation is
// disabled under prefers-reduced-motion. Uses useSyncExternalStore (the
// codebase pattern, see Navbar) for SSR-safe media reads without effect state.
export default function HeroGlobe() {
  const isDesktop = useSyncExternalStore(
    subscribe(DESKTOP_QUERY),
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
  const autoRotate = useSyncExternalStore(
    subscribe(REDUCE_QUERY),
    () => !window.matchMedia(REDUCE_QUERY).matches,
    () => true,
  );

  if (!isDesktop) return null;

  return (
    <div className="relative h-[420px] w-full flex items-center justify-center">
      {/* Gold ambient glow to tie the globe into the palette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_55%_at_50%_45%,rgba(236,194,70,0.16),transparent_65%)] blur-2xl"
      />
      <RotatingEarth width={420} height={420} autoRotate={autoRotate} className="relative z-10" />
    </div>
  );
}
