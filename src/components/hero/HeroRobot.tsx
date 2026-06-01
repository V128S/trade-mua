"use client";

import { useEffect, useState } from "react";
import { SplineScene } from "@/components/ui/splite";

// Interactive 3D robot for the home hero (replaces the vertical ASIC carousel).
// Color-matched into the dark/gold theme: a warm gold radial glow sits behind
// the scene and a bottom fade blends it into the page background.
//
// Desktop-only by design. We gate the mount on a matchMedia check (not just the
// parent's `hidden lg:block`) so the heavy Spline 3D runtime is never downloaded
// on phones — display:none would still load it. Honors reduced-motion.
export default function HeroRobot() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setShow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (!show) return null;

  return (
    <div className="relative h-[300px] sm:h-[380px] lg:h-[460px] w-full">
      {/* Warm gold ambient glow to tie the robot into the gold palette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_55%_at_60%_45%,rgba(236,194,70,0.20),transparent_65%)] blur-2xl"
      />
      <SplineScene
        scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
        className="relative z-10 w-full h-full"
      />
      {/* Blend the bottom edge into the page bg (also tones down the Spline badge) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-16 z-20 bg-gradient-to-t from-background to-transparent"
      />
    </div>
  );
}
