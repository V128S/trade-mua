"use client";

import { useState, useMemo } from "react";
import { parseHashrateTH } from "@/lib/utils";

interface Props {
  coinPrice: number;
  coinSymbol?: string;
  revenuePerTH: number;  // USD per TH-equivalent per day (spot)
  revenue24h?: number;   // 24h average (more stable for ROI calc)
  initialHashrate?: string;
  initialPower?: number;
  initialPrice?: number;
}

export default function Calculator({ coinPrice, coinSymbol = "BTC", revenuePerTH, revenue24h, initialHashrate = "", initialPower = 3500, initialPrice = 0 }: Props) {
  const [hashrate, setHashrate] = useState(initialHashrate);
  const [powerW, setPowerW] = useState(initialPower);
  const [electricityRate, setElectricityRate] = useState(0.07);
  const [price, setPrice] = useState(initialPrice);

  const result = useMemo(() => {
    const th = parseHashrateTH(hashrate);
    if (th <= 0 || revenuePerTH <= 0) return null;
    const dailyCost = (powerW / 1000) * 24 * electricityRate;
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
  }, [hashrate, powerW, electricityRate, revenuePerTH, revenue24h, price]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12">

      {/* Inputs */}
      <div className="space-y-6">

        {/* Coin price info */}
        <div className="bg-card border-card rounded-lg px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-[20px]">currency_bitcoin</span>
            <div>
              <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">
                Поточна ціна {coinSymbol}
              </p>
              <p className="font-headline-md text-headline-md text-primary">
                {coinPrice > 0 ? `$${coinPrice.toLocaleString()}` : "Завантаження..."}
              </p>
            </div>
          </div>
          <span className="chip px-2 py-1 font-technical-data text-[10px] uppercase">Live</span>
        </div>

        {/* Hashrate */}
        <div className="space-y-2">
          <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px] block">
            Хешрейт
          </label>
          <input
            type="text"
            value={hashrate}
            onChange={(e) => setHashrate(e.target.value)}
            placeholder="наприклад: 335 TH/s або 335"
            className="w-full bg-card border border-[#2e2d2b] rounded px-4 py-3 font-technical-data text-technical-data text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-primary/60 transition-colors"
          />
          <p className="font-label-caps text-label-caps text-on-surface-variant text-[10px]">
            TH/s, GH/s, MH/s, kH/s або kSol/s
          </p>
        </div>

        {/* Power */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">
              Споживання
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
              Тариф електроенергії
            </label>
            <span className="font-technical-data text-technical-data text-primary">${electricityRate.toFixed(3)}/кВт·год</span>
          </div>
          <input
            type="range"
            min={0.02}
            max={0.30}
            step={0.005}
            value={electricityRate}
            onChange={(e) => setElectricityRate(Number(e.target.value))}
          />
          <div className="flex justify-between font-label-caps text-[10px] text-on-surface-variant">
            <span>$0.02</span>
            <span className="text-primary">$0.07 (готель)</span>
            <span>$0.30</span>
          </div>
        </div>

        {/* Equipment price (optional — enables payback calc) */}
        <div className="space-y-2">
          <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px] block">
            Вартість обладнання ($)
          </label>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={price || ""}
            onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))}
            placeholder="наприклад: 5000"
            className="w-full bg-card border border-[#2e2d2b] rounded px-4 py-3 font-technical-data text-technical-data text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-primary/60 transition-colors"
          />
          <p className="font-label-caps text-label-caps text-on-surface-variant text-[10px]">
            Вкажіть, щоб розрахувати окупність
          </p>
        </div>

        {/* Hotel promo */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 flex items-start gap-3">
          <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">warehouse</span>
          <div>
            <p className="font-technical-data text-technical-data text-on-surface text-sm">
              Майнінг-готель Trade M — $0.07/кВт·год
            </p>
            <p className="font-label-caps text-[10px] text-on-surface-variant mt-0.5">
              Промисловий тариф, 24/7 моніторинг, Київ / Дніпро
            </p>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest mb-6">
          Розрахунок
        </h2>

        {result ? (
          <>
            {[
              { label: "На день", data: result.daily },
              { label: "На місяць", data: result.monthly },
              { label: "На рік", data: result.annual },
            ].map(({ label, data }) => (
              <div key={label} className="bg-card border-card rounded-lg p-5">
                <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px] mb-3">
                  {label}
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="font-label-caps text-[10px] text-on-surface-variant mb-1">Дохід</p>
                    <p className="font-technical-data text-technical-data text-green-400">${data.revenue.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="font-label-caps text-[10px] text-on-surface-variant mb-1">Витрати</p>
                    <p className="font-technical-data text-technical-data text-red-400">−${data.cost.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="font-label-caps text-[10px] text-on-surface-variant mb-1">Прибуток</p>
                    <p className={`font-technical-data text-technical-data ${data.profit > 0 ? "text-primary" : "text-red-400"}`}>
                      {data.profit > 0 ? `+$${data.profit.toFixed(2)}` : "−$0"}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* ROI */}
            <div className="bg-card border-card rounded-lg p-5 flex items-center justify-between">
              <div>
                <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px] mb-1">
                  Окупність обладнання
                </p>
                <p className="font-body-md text-body-md text-on-surface-variant text-sm">
                  При поточному курсі та тарифі
                </p>
              </div>
              <div className="text-right">
                {!result.hasPrice ? (
                  <p className="font-label-caps text-[10px] text-on-surface-variant max-w-[140px]">
                    Вкажіть вартість обладнання
                  </p>
                ) : isFinite(result.roi) ? (
                  <>
                    <p className="font-headline-md text-headline-md text-primary">{result.roi} днів</p>
                    <p className="font-label-caps text-[10px] text-on-surface-variant">≈{Math.ceil(result.roi / 30)} місяців</p>
                  </>
                ) : (
                  <p className="font-headline-md text-headline-md text-red-400">Збиток</p>
                )}
              </div>
            </div>

            <p className="font-label-caps text-[10px] text-on-surface-variant text-center pt-2">
              * Розрахунок орієнтовний. Реальний прибуток залежить від складності мережі та курсу BTC.
            </p>
          </>
        ) : (
          <div className="bg-card border-card rounded-lg p-12 flex flex-col items-center gap-4 text-on-surface-variant">
            <span className="material-symbols-outlined text-[48px]">calculate</span>
            <p className="font-body-md text-body-md text-center">
              Введіть хешрейт для розрахунку
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
