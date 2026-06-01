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
    const onMove = (e: MouseEvent) => {
      document.querySelectorAll<HTMLElement>(".glass").forEach((c) => {
        const r = c.getBoundingClientRect();
        if (
          e.clientX > r.left - 60 && e.clientX < r.right + 60 &&
          e.clientY > r.top - 60 && e.clientY < r.bottom + 60
        ) {
          c.style.setProperty("--mx", e.clientX - r.left + "px");
          c.style.setProperty("--my", e.clientY - r.top + "px");
        }
      });
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
        const n = Math.min(70, Math.floor((innerWidth * innerHeight) / 22000));
        for (let i = 0; i < n; i++)
          parts.push({
            x: Math.random() * cv.width, y: Math.random() * cv.height,
            vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
            s: Math.random() * 1.4 + 0.5, o: Math.random() * 0.35 + 0.12,
          });
      };
      const size = () => { cv.width = innerWidth; cv.height = innerHeight; init(); };
      const loop = () => {
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
        raf = requestAnimationFrame(loop);
      };
      addEventListener("resize", size);
      addEventListener("mousemove", onNetMove);
      addEventListener("mouseleave", onLeave);
      size(); loop();
      cleanupNet = () => {
        removeEventListener("resize", size);
        removeEventListener("mousemove", onNetMove);
        removeEventListener("mouseleave", onLeave);
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
