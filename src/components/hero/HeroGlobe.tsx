"use client";

import { useSyncExternalStore } from "react";
import RotatingEarth from "@/components/ui/wireframe-dotted-globe";

const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribe(cb: () => void) {
  const mq = window.matchMedia(DESKTOP_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

// Static wireframe globe for the home hero. Desktop-only via
// useSyncExternalStore(matchMedia) so d3 + geometry never load on phones.
// Rendered WITHOUT auto-rotation (no rAF loop) and with sparser dots, then
// deferred to idle inside RotatingEarth — keeps it off the performance trace.
// Drag to rotate / scroll to zoom still work on demand.
export default function HeroGlobe() {
  const isDesktop = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );

  if (!isDesktop) return null;

  return (
    <div className="relative h-[420px] w-full flex items-center justify-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_55%_at_50%_45%,rgba(236,194,70,0.16),transparent_65%)] blur-2xl"
      />
      <RotatingEarth width={420} height={420} autoRotate={false} dotSpacing={26} className="relative z-10" />
    </div>
  );
}
