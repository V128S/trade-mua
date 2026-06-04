"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { Review } from "@/lib/reviews";

const AUTO_MS = 4500;        // auto-advance interval
const CLAMP_CHARS = 180;     // show "read more" past this length

// Fisher–Yates shuffle (returns a new array).
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Auto-scrolling, seamlessly looping reviews track. The list is duplicated; once
// scrolling passes the first copy we jump back by exactly one copy's width — the
// content is identical there, so the loop is invisible. Long reviews clamp and
// expand on click; auto-scroll pauses on hover or while a card is expanded.
export default function ReviewsCarousel({ reviews }: { reviews: Review[] }) {
  const t = useTranslations("home");
  const locale = useLocale();
  const trackRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [hovered, setHovered] = useState(false);

  // Randomize the order so the row isn't strictly chronological. Start from the
  // server order (keeps SSR/client markup identical — no hydration mismatch),
  // then shuffle on the client after mount.
  const [ordered, setOrdered] = useState(reviews);
  useEffect(() => setOrdered(shuffle(reviews)), [reviews]);

  const paused = hovered || expanded.size > 0;
  const items = useMemo(() => [...ordered, ...ordered], [ordered]); // duplicate for the seamless loop

  // Scroll one card in a direction, with the invisible wrap at either edge so
  // the loop is seamless (used by both auto-scroll and the side buttons).
  const scroll = useCallback((dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const step = card ? card.offsetWidth + 24 : el.clientWidth * 0.85;
    const half = el.scrollWidth / 2;
    if (dir > 0 && el.scrollLeft >= half) el.scrollLeft -= half;
    if (dir < 0 && el.scrollLeft <= 0) el.scrollLeft += half;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }, []);

  // Seamless infinite loop for native scrolling (swipe / trackpad), which never
  // hits the JS `scroll()` wrap above: the list is duplicated, so position X and
  // X + half show identical content. Snapping back by one copy once we pass the
  // first copy keeps the loop endless and invisible — so reaching the end just
  // continues from the start.
  const onScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const half = el.scrollWidth / 2;
    if (half > 0 && el.scrollLeft >= half) el.scrollLeft -= half;
  }, []);

  useEffect(() => {
    if (paused) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => scroll(1), AUTO_MS);
    return () => clearInterval(id);
  }, [paused, scroll]);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const dateLocale = { uk: "uk-UA", en: "en-US", ru: "ru-RU" }[locale] ?? "uk-UA";

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex gap-gutter overflow-x-auto snap-x snap-mandatory py-4 px-1 -mx-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((review, idx) => {
          const isOpen = expanded.has(review.id);
          const isLong = review.review_text.length > CLAMP_CHARS;
          return (
            <div
              key={`${review.id}-${idx}`}
              data-card
              className="snap-start shrink-0 w-[88%] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] glass glass-hover group p-7 flex flex-col gap-4 cursor-default"
            >
              {/* Stars + verified badge */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-0.5 shrink-0">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={`material-symbols-outlined text-[15px] ${i < review.rating ? "text-primary" : "text-outline-variant/40"}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                      star
                    </span>
                  ))}
                </div>
                <span className="inline-flex items-center text-green-400" title={t("testimonialVerified")}>
                  <span className="max-w-0 -translate-x-1 opacity-0 overflow-hidden whitespace-nowrap font-label-caps text-[9px] uppercase tracking-wide transition-all duration-500 ease-out group-hover:max-w-[140px] group-hover:translate-x-0 group-hover:opacity-100 group-hover:mr-1 motion-reduce:transition-none">
                    {t("testimonialVerified")}
                  </span>
                  <span className="material-symbols-outlined text-[13px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                </span>
              </div>
              {/* Quote (clamped; click to expand) */}
              <div className="flex-1">
                <p className={`font-body-md text-body-md text-on-surface-variant leading-relaxed ${isOpen ? "" : "line-clamp-6"}`}>
                  &ldquo;{review.review_text}&rdquo;
                </p>
                {isLong && (
                  <button type="button" onClick={() => toggle(review.id)}
                    className="mt-1.5 font-label-caps text-[9px] text-primary uppercase tracking-widest hover:underline">
                    {isOpen ? t("reviewsLess") : t("reviewsMore")}
                  </button>
                )}
              </div>
              {/* Manager reply */}
              {review.manager_reply && (
                <div className="border-l-2 border-primary/40 pl-3">
                  <p className="font-label-caps text-[9px] text-primary uppercase tracking-widest">{t("managerReply")}</p>
                  <p className="font-body-md text-body-md text-on-surface-variant text-sm mt-1 leading-relaxed">{review.manager_reply}</p>
                </div>
              )}
              {/* Author */}
              <div className="border-t border-card-border pt-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <span className="font-headline-md text-primary text-[13px]">{review.author_name.charAt(0)}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-technical-data text-sm text-on-surface leading-tight">{review.author_name}</p>
                  <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest mt-0.5">
                    {[review.author_location, new Date(review.review_date).toLocaleDateString(dateLocale, { day: "2-digit", month: "short", year: "numeric" })].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>
              {/* Telegram proof link */}
              {review.telegram_url && (
                <a href={review.telegram_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-label-caps text-[9px] text-on-surface-variant hover:text-primary uppercase tracking-widest transition-colors">
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  {t("viewInTelegram")}
                </a>
              )}
            </div>
          );
        })}
      </div>

      {/* Side arrows — visual affordance that the row is scrollable + manual
          control. Vertically centered, overlaid; inline SVG so they always render. */}
      <button type="button" onClick={() => scroll(-1)} aria-label={t("reviewsPrev")}
        className="grid place-items-center absolute top-1/2 -translate-y-1/2 left-0 lg:-left-5 z-10 w-11 h-11 rounded-full bg-card border border-card-border text-on-surface hover:text-primary hover:border-primary transition-colors shadow-lg">
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button type="button" onClick={() => scroll(1)} aria-label={t("reviewsNext")}
        className="grid place-items-center absolute top-1/2 -translate-y-1/2 right-0 lg:-right-5 z-10 w-11 h-11 rounded-full bg-card border border-card-border text-on-surface hover:text-primary hover:border-primary transition-colors shadow-lg">
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 6l6 6 -6 6" />
        </svg>
      </button>
    </div>
  );
}
