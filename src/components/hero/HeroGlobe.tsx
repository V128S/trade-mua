"use client";

import { useSyncExternalStore } from "react";
import Image from "next/image";

const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribe(cb: () => void) {
  const mq = window.matchMedia(DESKTOP_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

// Hero globe — now the lightest possible form: a single static image (the same
// gold dotted globe, pre-rendered) instead of a runtime d3/canvas globe. Zero
// JS work, no d3, no dot generation. Desktop-only via matchMedia so the image
// isn't even fetched on phones (the hero column is hidden there anyway).
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
      <Image
        src="/hero-globe.png"
        alt=""
        width={420}
        height={420}
        sizes="420px"
        className="relative z-10 w-auto h-auto max-h-full object-contain"
      />
    </div>
  );
}
