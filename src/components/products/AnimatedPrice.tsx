"use client";

import { useEffect, useRef, useState } from "react";

const DURATION_MS = 450;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Tweens the displayed number from its previous value to `value` on every
// change — the "price rolls to the new value" effect for the batch selector,
// where only the price differs between otherwise-identical variants. No
// animation library: a small requestAnimationFrame tween, same spirit as the
// rest of the site's pure-CSS/lightweight-JS motion. Reduced motion collapses
// the tween to a single frame instead of a separate synchronous code path,
// so every update flows through the same rAF-callback (never setState
// directly in the effect body, and refs are only touched from effects/
// callbacks, never during render).
export default function AnimatedPrice({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;

    const duration = prefersReducedMotion() ? 0 : DURATION_MS;
    const start = performance.now();
    let raf: number;

    function tick(now: number) {
      const t = duration === 0 ? 1 : Math.min(1, (now - start) / duration);
      setDisplay(Math.round(from + (to - from) * easeOutCubic(t)));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    }
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <span className={className}>${display.toLocaleString()}</span>;
}
