"use client";

import { useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { Review } from "@/lib/reviews";

// Horizontal, snap-scrolling reviews track with prev/next buttons.
// Cards are sized so ~1 (mobile) / 2 (sm) / 4 (lg) are visible; the buttons
// scroll by one card width. The track is also swipeable on touch.
export default function ReviewsCarousel({ reviews }: { reviews: Review[] }) {
  const t = useTranslations("home");
  const locale = useLocale();
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const amount = card ? card.offsetWidth + 24 : el.clientWidth * 0.85;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  const dateLocale = { uk: "uk-UA", en: "en-US", ru: "ru-RU" }[locale] ?? "uk-UA";

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="flex gap-gutter overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 px-1 -mx-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {reviews.map((review) => (
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
            {/* Quote */}
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed flex-1">
              &ldquo;{review.review_text}&rdquo;
            </p>
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
        ))}
      </div>

      {/* Prev / Next */}
      <div className="flex justify-end gap-2 mt-4">
        <button type="button" onClick={() => scroll(-1)} aria-label={t("reviewsPrev")}
          className="btn-ghost w-11 h-11 rounded grid place-items-center hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-[20px]">chevron_left</span>
        </button>
        <button type="button" onClick={() => scroll(1)} aria-label={t("reviewsNext")}
          className="btn-ghost w-11 h-11 rounded grid place-items-center hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-[20px]">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
