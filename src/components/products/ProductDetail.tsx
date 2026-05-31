"use client";

import { Link } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Product } from "@/lib/sheets";
import { parseHashrateTH } from "@/lib/utils";

interface Config {
  id: string;
  hashrate: string;
  powerW: number;
  priceUSDT: number;
  inStock: boolean;
}

interface Props {
  product: Product;
  configs: Config[];
  revenuePerTH: number; // USD per TH-equivalent per day
}

export default function ProductDetail({ product, configs, revenuePerTH }: Props) {
  const t = useTranslations("products");
  const [rate, setRate] = useState(0.07);

  const th = parseHashrateTH(product.hashrate);
  const dailyElec = (product.powerW / 1000) * 24 * rate;
  const dailyRev = revenuePerTH > 0 && th > 0 ? revenuePerTH * th : 0;
  const dailyProfit = Math.max(0, dailyRev - dailyElec);

  const hasConfigs = configs.length > 1;

  return (
    <>
      {/* ── Config selector ── */}
      {hasConfigs && (
        <div className="mt-6">
          <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px] mb-3">
            {t("configSelectorLabel")}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {configs.map((c) => {
              const isCurrent = c.id === product.id;
              return (
                <Link
                  key={c.id}
                  href={`/products/${c.id}`}
                  className={`p-3 rounded border transition-colors duration-200 flex flex-col gap-0.5 ${
                    isCurrent
                      ? "border-primary bg-primary/10"
                      : "border-card-border hover:border-primary/50 bg-card"
                  }`}
                >
                  <span className={`font-technical-data text-technical-data text-sm ${isCurrent ? "text-primary" : "text-on-surface"}`}>
                    {c.hashrate || `${c.powerW}W`}
                  </span>
                  <span className="font-label-caps text-[10px] text-on-surface-variant">
                    {c.powerW} W
                  </span>
                  <span className={`font-label-caps text-[10px] mt-1 ${c.inStock ? "text-green-400" : "text-on-surface-variant"}`}>
                    {c.inStock ? t("inStock") : t("onOrder")}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Mini profitability calculator ── */}
      <div className="mt-8 bg-card border-card rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-primary text-[18px]">calculate</span>
          <p className="font-label-caps text-label-caps text-on-surface uppercase tracking-widest text-[11px]">
            {t("calcTitle")}
          </p>
        </div>

        {/* Slider */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
              {t("calcElecLabel")}
            </span>
            <span className="font-technical-data text-technical-data text-primary text-sm">${rate.toFixed(3)}</span>
          </div>
          <input
            type="range" min={0.02} max={0.25} step={0.005}
            value={rate} onChange={(e) => setRate(Number(e.target.value))}
          />
        </div>

        {/* Power chip */}
        <div className="inline-flex items-center gap-1 chip px-3 py-1 text-[11px]">
          <span className="material-symbols-outlined text-[14px]">bolt</span>
          {t("calcConsumption", { power: product.powerW })}
        </div>

        {/* Results */}
        {dailyRev > 0 ? (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-surface-container rounded p-3">
              <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">{t("calcRevenueDay")}</p>
              <p className="font-headline-md text-headline-md text-primary">${dailyRev.toFixed(2)}</p>
            </div>
            <div className="bg-surface-container rounded p-3">
              <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">{t("calcProfitDay")}</p>
              <p className={`font-headline-md text-headline-md ${dailyProfit > 0 ? "text-green-400" : "text-red-400"}`}>
                {dailyProfit > 0 ? `+$${dailyProfit.toFixed(2)}` : `−$${(dailyElec - dailyRev).toFixed(2)}`}
              </p>
            </div>
            <div className="bg-surface-container rounded p-3">
              <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">{t("calcRevenueMonth")}</p>
              <p className="font-technical-data text-technical-data text-on-surface">${(dailyRev * 30).toFixed(0)}</p>
            </div>
            <div className="bg-surface-container rounded p-3">
              <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">{t("calcCostMonth")}</p>
              <p className="font-technical-data text-technical-data text-on-surface">−${(dailyElec * 30).toFixed(0)}</p>
            </div>
          </div>
        ) : (
          <p className="font-label-caps text-[10px] text-on-surface-variant text-center py-2">
            {t("calcLoading")}
          </p>
        )}

        <Link
          href={`/calculator?hashrate=${encodeURIComponent(product.hashrate)}&power=${product.powerW}&price=${product.priceUSDT}&algorithm=${encodeURIComponent(product.algorithm)}`}
          className="inline-flex items-center gap-1 font-label-caps text-[10px] text-primary uppercase tracking-widest hover:text-secondary transition-colors"
        >
          {t("calcFullLink")}
          <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
        </Link>
      </div>
    </>
  );
}
