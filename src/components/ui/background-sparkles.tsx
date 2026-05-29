"use client";

import { useSyncExternalStore } from "react";
import { SparklesCore } from "./sparkles";

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

  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden>
      <SparklesCore
        id="bg-sparkles"
        background="transparent"
        minSize={0.4}
        maxSize={1.2}
        speed={1}
        particleColor={theme === "dark" ? "#ecc246" : "#c9a227"}
        particleDensity={theme === "dark" ? 65 : 35}
        className="w-full h-full"
      />
    </div>
  );
}
