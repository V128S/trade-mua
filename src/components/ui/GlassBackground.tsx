"use client";

import { useEffect } from "react";

// Ambient atmosphere for the glass-gold theme: gradient mesh + grain + a
// blockchain-node network canvas, plus the scroll-reveal observer and the
// .glass mouse-glow. Client-only, gated on prefers-reduced-motion. Replaces
// the old tsparticles BackgroundSparkles.
export default function GlassBackground() {
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

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
    // cursor instead of measuring every .glass on the page — the old loop ran
    // getBoundingClientRect() on every card per mousemove (a forced-reflow storm
    // on the catalog grid, the main source of Chromium scroll/move jank).
    const onMove = (e: MouseEvent) => {
      const c = (e.target as Element | null)?.closest<HTMLElement>(".glass");
      if (!c) return;
      const r = c.getBoundingClientRect();
      c.style.setProperty("--mx", e.clientX - r.left + "px");
      c.style.setProperty("--my", e.clientY - r.top + "px");
    };
    document.addEventListener("mousemove", onMove);

    // ── Network canvas ──
    let raf = 0;
    let cleanupNet = () => {};
    const cv = document.getElementById("net") as HTMLCanvasElement | null;
    if (cv && !reduce) {
      const cx = cv.getContext("2d")!;
      let parts: { x: number; y: number; vx: number; vy: number; s: number; o: number }[] = [];
      const mouse: { x: number | null; y: number | null } = { x: null, y: null };
      const onNetMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
      const onLeave = () => { mouse.x = mouse.y = null; };
      const init = () => {
        parts = [];
        const n = Math.min(45, Math.floor((innerWidth * innerHeight) / 30000));
        for (let i = 0; i < n; i++)
          parts.push({
            x: Math.random() * cv.width, y: Math.random() * cv.height,
            vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
            s: Math.random() * 1.4 + 0.5, o: Math.random() * 0.35 + 0.12,
          });
      };
      const size = () => { cv.width = innerWidth; cv.height = innerHeight; init(); };

      // Pause the canvas while the user is actively scrolling so its rAF work
      // never competes with scroll compositing (the Chromium scroll-jank fix),
      // and cap to ~30fps — ambient nodes don't need 60fps, which roughly halves
      // the idle CPU/GPU draw (what spins up the fan).
      let scrolling = false;
      let scrollTimer = 0;
      const onScroll = () => {
        scrolling = true;
        clearTimeout(scrollTimer);
        scrollTimer = window.setTimeout(() => { scrolling = false; }, 140);
      };
      addEventListener("scroll", onScroll, { passive: true });

      const FRAME_MS = 1000 / 30;
      let lastT = 0;
      const loop = (t = 0) => {
        raf = requestAnimationFrame(loop);
        if (scrolling || document.hidden || t - lastT < FRAME_MS) return;
        lastT = t;
        cx.clearRect(0, 0, cv.width, cv.height);
        parts.forEach((p) => {
          if (mouse.x !== null && mouse.y !== null) {
            const dx = mouse.x - p.x, dy = mouse.y - p.y, dist = Math.hypot(dx, dy);
            if (dist < 150) { p.x += (dx / dist) * ((150 - dist) / 150) * 0.5; p.y += (dy / dist) * ((150 - dist) / 150) * 0.5; }
          }
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > cv.width) p.vx *= -1;
          if (p.y < 0 || p.y > cv.height) p.vy *= -1;
          cx.beginPath(); cx.arc(p.x, p.y, p.s, 0, 7); cx.fillStyle = `rgba(236,194,70,${p.o})`; cx.fill();
        });
        for (let a = 0; a < parts.length; a++)
          for (let b = a + 1; b < parts.length; b++) {
            const dx = parts[a].x - parts[b].x, dy = parts[a].y - parts[b].y, d = Math.hypot(dx, dy);
            if (d < 130) {
              cx.beginPath(); cx.moveTo(parts[a].x, parts[a].y); cx.lineTo(parts[b].x, parts[b].y);
              cx.strokeStyle = `rgba(236,194,70,${((130 - d) / 130) * 0.1})`; cx.lineWidth = 0.5; cx.stroke();
            }
          }
      };
      addEventListener("resize", size);
      addEventListener("mousemove", onNetMove);
      addEventListener("mouseleave", onLeave);
      size(); loop();
      cleanupNet = () => {
        removeEventListener("resize", size);
        removeEventListener("mousemove", onNetMove);
        removeEventListener("mouseleave", onLeave);
        removeEventListener("scroll", onScroll);
        clearTimeout(scrollTimer);
      };
    }

    return () => {
      io.disconnect();
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
      cleanupNet();
    };
  }, []);

  return (
    <>
      <div className="ambient" aria-hidden />
      <div className="grain" aria-hidden />
      <canvas id="net" aria-hidden />
    </>
  );
}
