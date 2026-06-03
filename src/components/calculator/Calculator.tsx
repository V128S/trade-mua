"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { parseHashrateTH } from "@/lib/utils";

interface Props {
  coinPrice: number;
  coinSymbol?: string;
  revenuePerTH: number;  // USD per TH-equivalent per day (spot)
  revenue24h?: number;   // 24h average (more stable for ROI calc)
  usdUah: number;        // live USD→UAH rate; electricity is entered in UAH
  initialHashrate?: string;
  initialPower?: number;
  initialPrice?: number;
}

export default function Calculator({ coinPrice, coinSymbol = "BTC", revenuePerTH, revenue24h, usdUah, initialHashrate = "", initialPower = 3500, initialPrice = 0 }: Props) {
  const t = useTranslations("calculator");
  const [hashrate, setHashrate] = useState(initialHashrate);
  const [powerW, setPowerW] = useState(initialPower);
  // Electricity tariff in UAH (грн/кВт·год); 3.6 is the mining-hotel rate.
  const [electricityRate, setElectricityRate] = useState(3.6);
  const [price, setPrice] = useState(initialPrice);

  const result = useMemo(() => {
    const th = parseHashrateTH(hashrate);
    if (th <= 0 || revenuePerTH <= 0) return null;
    // Tariff is in UAH; convert the daily cost to USD to match USD revenue.
    const dailyCost = ((powerW / 1000) * 24 * electricityRate) / usdUah;
    const dailyRevenue = revenuePerTH * th;
    const dailyProfit = Math.max(0, dailyRevenue - dailyCost);
    // ROI uses 24h average for more stable estimate
    const rev24 = (revenue24h ?? revenuePerTH) * th;
    const profit24 = Math.max(0, rev24 - dailyCost);
    const roi = price > 0 && profit24 > 0 ? Math.ceil(price / profit24) : Infinity;
    return {
      daily: { cost: dailyCost, revenue: dailyRevenue, profit: dailyProfit },
      monthly: { cost: dailyCost * 30, revenue: dailyRevenue * 30, profit: dailyProfit * 30 },
      annual: { cost: dailyCost * 365, revenue: dailyRevenue * 365, profit: dailyProfit * 365 },
      roi,
      hasPrice: price > 0,
    };
  }, [hashrate, powerW, electricityRate, revenuePerTH, revenue24h, price, usdUah]);

  const periods = [
    { key: "periodDay", data: result?.daily },
    { key: "periodMonth", data: result?.monthly },
    { key: "periodYear", data: result?.annual },
  ] as const;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12">

      {/* Inputs */}
      <div className="space-y-6">

        {/* Coin price info */}
        <div className="glass px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-[20px]">currency_bitcoin</span>
            <div>
              <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">
                {t("coinPriceLabel", { coinSymbol })}
              </p>
              <p className="font-headline-md text-headline-md gold-text">
                {coinPrice > 0
                  ? `$${coinPrice.toLocaleString("en-US", {
                      minimumFractionDigits: coinPrice > 30 ? 0 : 2,
                      maximumFractionDigits: coinPrice > 30 ? 0 : 2,
                    })}`
                  : t("coinPriceLoading")}
              </p>
            </div>
          </div>
          <span className="chip px-2 py-1 font-technical-data text-[10px] uppercase">Live</span>
        </div>

        {/* Hashrate */}
        <div className="space-y-2">
          <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px] block">
            {t("hashrateLabel")}
          </label>
          <input
            type="text"
            value={hashrate}
            onChange={(e) => setHashrate(e.target.value)}
            placeholder={t("hashratePlaceholder")}
            className="field font-mono"
          />
          <p className="font-label-caps text-label-caps text-on-surface-variant text-[10px]">
            {t("hashrateHint")}
          </p>
        </div>

        {/* Power */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">
              {t("powerLabel")}
            </label>
            <span className="font-technical-data text-technical-data text-primary">{powerW} W</span>
          </div>
          <input
            type="range"
            min={100}
            max={10000}
            step={50}
            value={powerW}
            onChange={(e) => setPowerW(Number(e.target.value))}
          />
          <div className="flex justify-between font-label-caps text-[10px] text-on-surface-variant">
            <span>100 W</span>
            <span>10 000 W</span>
          </div>
        </div>

        {/* Electricity rate */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">
              {t("electricityLabel")}
            </label>
            <span className="font-technical-data text-technical-data text-primary">{t("unitKwhRate", { rate: electricityRate })}</span>
          </div>
          <input
            type="range"
            min={0}
            max={8.88}
            step={0.1}
            value={electricityRate}
            onChange={(e) => setElectricityRate(Number(e.target.value))}
          />
          <div className="flex justify-between font-label-caps text-[10px] text-on-surface-variant">
            <span>{t("electricityMinMark")}</span>
            <span className="text-primary">{t("electricityHotelMark")}</span>
            <span>{t("electricityMaxMark")}</span>
          </div>
          <p className="font-label-caps text-[10px] text-on-surface-variant">
            {t("fxNote", { rate: Math.round(usdUah * 100) / 100 })}
          </p>
        </div>

        {/* Equipment price (optional — enables payback calc) */}
        <div className="space-y-2">
          <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px] block">
            {t("equipmentPriceLabel")}
          </label>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={price || ""}
            onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))}
            placeholder={t("equipmentPricePlaceholder")}
            className="field font-mono"
          />
          <p className="font-label-caps text-label-caps text-on-surface-variant text-[10px]">
            {t("equipmentPriceHint")}
          </p>
        </div>

        {/* Hotel promo */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 flex items-start gap-3">
          <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">warehouse</span>
          <div>
            <p className="font-technical-data text-technical-data text-on-surface text-sm">
              {t("hotelPromoTitle")}
            </p>
            <p className="font-label-caps text-[10px] text-on-surface-variant mt-0.5">
              {t("hotelPromoDesc")}
            </p>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h2 className="font-headline-md text-headline-md gold-text uppercase tracking-widest mb-6">
          {t("resultsHeading")}
        </h2>

        {result ? (
          <>
            {periods.map(({ key, data }) => (
              <div key={key} className="glass p-5">
                <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px] mb-3">
                  {t(key)}
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="font-label-caps text-[10px] text-on-surface-variant mb-1">{t("colRevenue")}</p>
                    <p className="font-technical-data text-technical-data text-green-400">${data!.revenue.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="font-label-caps text-[10px] text-on-surface-variant mb-1">{t("colCost")}</p>
                    <p className="font-technical-data text-technical-data text-red-400">−${data!.cost.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="font-label-caps text-[10px] text-on-surface-variant mb-1">{t("colProfit")}</p>
                    <p className={`font-technical-data text-technical-data ${data!.profit > 0 ? "text-primary" : "text-red-400"}`}>
                      {data!.profit > 0 ? `+$${data!.profit.toFixed(2)}` : "−$0"}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* ROI */}
            <div className="glass p-5 flex items-center justify-between">
              <div>
                <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px] mb-1">
                  {t("roiHeading")}
                </p>
                <p className="font-body-md text-body-md text-on-surface-variant text-sm">
                  {t("roiSubtitle")}
                </p>
              </div>
              <div className="text-right">
                {!result.hasPrice ? (
                  <p className="font-label-caps text-[10px] text-on-surface-variant max-w-[140px]">
                    {t("roiNeedPrice")}
                  </p>
                ) : isFinite(result.roi) ? (
                  <>
                    <p className="font-headline-md text-headline-md gold-text">{t("roiDays", { days: result.roi })}</p>
                    <p className="font-label-caps text-[10px] text-on-surface-variant">{t("roiMonths", { months: Math.ceil(result.roi / 30) })}</p>
                  </>
                ) : (
                  <p className="font-headline-md text-headline-md text-red-400">{t("roiLoss")}</p>
                )}
              </div>
            </div>

            <p className="font-label-caps text-[10px] text-on-surface-variant text-center pt-2">
              {t("disclaimer")}
            </p>
          </>
        ) : (
          <div className="glass p-12 flex flex-col items-center gap-4 text-on-surface-variant">
            <span className="material-symbols-outlined text-[48px]">calculate</span>
            <p className="font-body-md text-body-md text-center">
              {t("emptyState")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
