"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { Review } from "@/lib/reviews";

const AUTO_MS = 4500;        // auto-advance interval
const CLAMP_CHARS = 180;     // show "read more" past this length

// Auto-scrolling, swipeable reviews track. Long reviews are clamped and expand
// on click; auto-scroll pauses while hovering or when a card is expanded.
export default function ReviewsCarousel({ reviews }: { reviews: Review[] }) {
  const t = useTranslations("home");
  const locale = useLocale();
  const trackRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [hovered, setHovered] = useState(false);

  const paused = hovered || expanded.size > 0;

  useEffect(() => {
    if (paused) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      const el = trackRef.current;
      if (!el) return;
      const card = el.querySelector<HTMLElement>("[data-card]");
      const amount = card ? card.offsetWidth + 24 : el.clientWidth * 0.85;
      // Loop back to the start once the end is reached.
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 4) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: amount, behavior: "smooth" });
      }
    }, AUTO_MS);
    return () => clearInterval(id);
  }, [paused]);

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
        className="flex gap-gutter overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 px-1 -mx-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {reviews.map((review) => {
          const isOpen = expanded.has(review.id);
          const isLong = review.review_text.length > CLAMP_CHARS;
          return (
            <div
              key={review.id}
              data-card
              className="snap-start shrink-0 w-[85%] sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] glass glass-hover group p-6 flex flex-col gap-4 cursor-default"
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
    </div>
  );
}
