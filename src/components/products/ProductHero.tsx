"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { Product } from "@/lib/sheets";
import { formatBatchLabel, type BatchMonth } from "@/lib/batch";
import { getProductImage } from "@/lib/product-images";
import AddToCartButton from "@/components/cart/AddToCartButton";
import { TrackProductView } from "@/lib/analytics/TrackView";
import AnimatedPrice from "./AnimatedPrice";
import ProductDetail, { type Config } from "./ProductDetail";
import { Link } from "@/i18n/navigation";

interface BatchOption {
  id: string;
  batch: BatchMonth;
  priceUSDT: number;
  inStock: boolean;
}

interface Props {
  product: Product;      // server-resolved product for the landed slug — the default selection
  batches: BatchOption[]; // supply-batch siblings (same name+hashrate); includes `product` itself
  descKey: "descHydro" | "descImmersion" | "descAir";
  configs: Config[];      // hashrate config selector — unaffected by batch selection
  revenuePerTH: number;
  usdUah: number;
}

// Batch siblings are the same physical unit — only price/stock/delivery month
// differ — so picking one is a pure client-side swap: no navigation, no page
// reload, price rolls to its new value via AnimatedPrice.
export default function ProductHero({ product, batches, descKey, configs, revenuePerTH, usdUah }: Props) {
  const t = useTranslations("products");
  const locale = useLocale();
  const [selectedId, setSelectedId] = useState(product.id);
  const hasBatches = batches.length > 1;

  const selected = useMemo(
    () => batches.find((b) => b.id === selectedId),
    [batches, selectedId],
  );

  const current: Product = selected
    ? { ...product, id: selected.id, priceUSDT: selected.priceUSDT, inStock: selected.inStock }
    : product;

  const displayName = product.name.replace(/\s*\d[\d.,]*\s*(?:TH\/s|GH\/s|MH\/s|Th|Gh|Mh|T|G|M)\s*$/i, "").trim();
  const imgSrc = getProductImage(product.name, product.imageUrl);

  return (
    <>
      {/* Left — product image (identical across batch siblings) */}
      <div className="relative glass overflow-hidden aspect-square flex items-center justify-center">
        <div className="grid-tex" />
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="relative z-10 object-contain p-8 drop-shadow-2xl"
            priority
          />
        ) : (
          <span className="material-symbols-outlined text-outline-variant text-[120px] relative z-10">memory</span>
        )}
        <div className="absolute top-4 left-4 flex gap-2 z-20">
          {product.isNew && (
            <span className="chip px-2 py-1 font-technical-data text-[10px] uppercase tracking-wider">{t("badgeNew")}</span>
          )}
          {current.inStock ? (
            <span className="chip px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider inline-flex items-center gap-1 !bg-green-400/10 !border-green-400/30 !text-green-400">
              <span className="material-symbols-outlined text-[12px]">check_circle</span>
              {t("inStock")}
            </span>
          ) : (
            <span className="chip px-2 py-1 font-technical-data text-[10px] uppercase tracking-wider">{t("onOrder")}</span>
          )}
        </div>
      </div>

      {/* Right — details */}
      <div className="flex flex-col gap-0">
        {/* Algorithm label */}
        <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest text-[11px]">
          {product.algorithm}
        </span>

        {/* Name */}
        <h1 className="font-headline-lg text-headline-lg text-on-surface mt-2 leading-tight">
          {displayName}
          {product.hashrate && (
            <span className="text-on-surface-variant ml-2 font-normal">{product.hashrate}</span>
          )}
        </h1>

        {/* Description */}
        <p className="font-body-md text-body-md text-on-surface-variant mt-3 max-w-md">
          {t(descKey)}
        </p>

        {/* Price */}
        <div className="mt-6">
          <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">
            {current.inStock ? t("priceLabelInStock") : t("priceLabelOnOrder")}
          </p>
          <AnimatedPrice value={current.priceUSDT} className="font-display-lg text-[52px] leading-none gold-text" />
          <p className="font-label-caps text-[10px] text-on-surface-variant mt-1">{t("priceCurrency")}</p>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap gap-3 mt-6">
          <AddToCartButton product={current} />
          <TrackProductView product={product} />
          <Link href="/contact" className="btn-ghost py-4 px-8 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">contact_support</span>
            {t("consultButton")}
          </Link>
        </div>

        {/* ── Batch selector — supply-batch (delivery month). Same tile-grid
            pattern as the hashrate config selector, but picking one just
            swaps local state (price/stock/CTA) instead of navigating. ── */}
        {hasBatches && (
          <div className="mt-6">
            <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px] mb-3">
              {t("batchSelectorLabel")}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {batches.map((b) => {
                const isCurrent = b.id === selectedId;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedId(b.id)}
                    className={`p-3 rounded-lg border transition-colors duration-200 flex flex-col gap-0.5 text-left ${
                      isCurrent
                        ? "border-primary bg-primary/10"
                        : "border-white/10 hover:border-primary/50 bg-white/[0.02]"
                    }`}
                  >
                    <span className={`font-technical-data text-technical-data text-sm ${isCurrent ? "text-primary" : "text-on-surface"}`}>
                      {formatBatchLabel(b.batch, locale)}
                    </span>
                    <span className="font-label-caps text-[10px] text-on-surface-variant">
                      ${b.priceUSDT.toLocaleString()}
                    </span>
                    <span className={`font-label-caps text-[10px] mt-1 ${b.inStock ? "text-green-400" : "text-on-surface-variant"}`}>
                      {b.inStock ? t("inStock") : t("onOrder")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Config selector (hashrate) + mini calculator */}
        <ProductDetail product={product} configs={configs} revenuePerTH={revenuePerTH} usdUah={usdUah} />
      </div>
    </>
  );
}
