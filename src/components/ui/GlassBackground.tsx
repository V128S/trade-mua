"use client";

import { useEffect } from "react";

// Ambient atmosphere for the glass-gold theme: a static gradient mesh + grain,
// plus the scroll-reveal observer and the .glass mouse-glow. The animated
// blockchain-node canvas was removed — its perpetual rAF loop was the main idle
// CPU/fan and scroll-contention cost in Chromium. Client-only.
export default function GlassBackground() {
  useEffect(() => {
    // ── Scroll reveal ──
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.06, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".reveal, .stagger").forEach((el) => io.observe(el));

    // ── Glass mouse-glow ──
    // The glow is only visible on :hover, so update just the card under the
    // cursor instead of measuring every .glass on the page.
    const onMove = (e: MouseEvent) => {
      const c = (e.target as Element | null)?.closest<HTMLElement>(".glass");
      if (!c) return;
      const r = c.getBoundingClientRect();
      c.style.setProperty("--mx", e.clientX - r.left + "px");
      c.style.setProperty("--my", e.clientY - r.top + "px");
    };
    document.addEventListener("mousemove", onMove);

    return () => {
      io.disconnect();
      document.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <>
      <div className="ambient" aria-hidden />
      <div className="grain" aria-hidden />
    </>
  );
}
