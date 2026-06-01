"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { Product } from "@/lib/sheets";
import { getProductImage } from "@/lib/product-images";
import { parseHashrateTH } from "@/lib/utils";

// Default electricity rate for the catalog profit estimate ($/kWh).
// Matches the product-detail mini-calculator default.
const DEFAULT_RATE = 0.07;

export function ProductCard({
  product,
  revenuePerTH = 0,
}: {
  product: Product;
  revenuePerTH?: number;
}) {
  const t = useTranslations("products");
  const imgSrc = getProductImage(product.name);

  // Estimated daily profit at the default electricity rate
  const th = parseHashrateTH(product.hashrate);
  const dailyRev = revenuePerTH > 0 && th > 0 ? revenuePerTH * th : 0;
  const dailyElec = (product.powerW / 1000) * 24 * DEFAULT_RATE;
  const dailyProfit = dailyRev > 0 ? dailyRev - dailyElec : 0;
  return (
    <Link
      href={`/products/${product.id}`}
      className="glass glass-hover group overflow-hidden flex flex-col"
    >
      <div className="relative h-44 plate flex items-center justify-center overflow-hidden border-b border-white/5">
        <div className="grid-tex" />
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
            className="relative z-10 object-contain p-4 drop-shadow-lg group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <span className="material-symbols-outlined text-outline-variant group-hover:text-primary/40 transition-colors text-[64px] relative z-10">
            memory
          </span>
        )}
        <div className="absolute top-3 left-3 flex gap-2 z-20">
          {product.isNew && (
            <span className="chip px-2 py-0.5 font-technical-data text-[10px] uppercase tracking-wider">
              {t("badgeNew")}
            </span>
          )}
          {/* Only the positive in-stock state gets a badge on the image — pre-order
              is shown as a calm delivery line in the body instead of an alarming chip,
              so the catalog reads as "available, ships soon" rather than "nothing here". */}
          {product.inStock && (
            <span className="chip px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider inline-flex items-center gap-1 !bg-green-400/10 !border-green-400/30 !text-green-400">
              <span className="material-symbols-outlined text-[12px]">check_circle</span>
              {t("inStock")}
            </span>
          )}
        </div>
      </div>

      <div className="p-5 flex flex-col gap-2 border-t border-card-border flex-1">
        <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">
          {product.algorithm}
        </span>
        <h3 className="font-technical-data text-technical-data text-on-surface leading-snug">
          {product.name}
        </h3>
        <div className="flex gap-4 mt-1">
          {product.hashrate && (
            <span className="font-label-caps text-label-caps text-on-surface-variant">
              {product.hashrate}
            </span>
          )}
          <span className="font-label-caps text-label-caps text-on-surface-variant">
            {product.powerW} W
          </span>
        </div>
        <div className="mt-auto pt-3 flex flex-col gap-2.5">
          {dailyProfit > 0 && (
            <div className="flex items-center gap-1.5 text-green-400">
              <span className="material-symbols-outlined text-[15px]">trending_up</span>
              <span className="font-technical-data text-technical-data text-xs">
                ~${dailyProfit.toFixed(2)}
              </span>
              <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                {t("perDay")}
              </span>
            </div>
          )}
          {/* Stock/delivery signal on every card — in-stock is reassuring green,
              pre-order is a neutral "ships in 10–14 days" rather than a hard stop. */}
          {product.inStock ? (
            <div className="flex items-center gap-1.5 text-green-400">
              <span className="material-symbols-outlined text-[15px]">local_shipping</span>
              <span className="font-label-caps text-[10px] uppercase tracking-widest">
                {t("readyToShip")}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-on-surface-variant">
              <span className="material-symbols-outlined text-[15px]">schedule</span>
              <span className="font-label-caps text-[10px] uppercase tracking-widest">
                {t("deliveryEstimate")}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <span className="font-headline-md text-headline-md gold-text">
              ${product.priceUSDT.toLocaleString()}
            </span>
            {/* CTA fills gold on card hover (group-hover) to pull the eye toward the click. */}
            <span className="inline-flex items-center gap-1.5 border border-card-border px-4 py-2 rounded font-label-caps text-label-caps uppercase tracking-widest text-xs text-on-surface transition-colors duration-300 group-hover:bg-primary-container group-hover:border-primary group-hover:text-[#0e0e0a]">
              {t("details")}
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
