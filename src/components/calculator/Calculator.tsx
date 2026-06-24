"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { parseHashrateTH } from "@/lib/utils";

// ── Hashrate unit helpers ─────────────────────────────────────────────────────

type HashrateUnit = "TH/s" | "GH/s" | "MH/s" | "kH/s" | "kSol/s";

// Per-algorithm allowed units (ordered largest → smallest for the dropdown).
// Only units that actually make sense for that algo's ASICs / miners are listed.
const ALGO_UNITS: Record<string, HashrateUnit[]> = {
  SHA256:     ["TH/s", "GH/s"],                   // BTC  — S21 ~200 TH/s
  Scrypt:     ["GH/s", "MH/s"],                   // DOGE+LTC — L9 ~16 GH/s
  KHeavyHash: ["TH/s", "GH/s"],                   // KAS  — KS5 ~21 TH/s
  EthHash:    ["GH/s", "MH/s"],                   // ETC  — GPU rigs, GH or MH
  Eaglesong:  ["TH/s", "GH/s"],                   // CKB  — K9 Pro ~5 TH/s
  Equihash:   ["kSol/s"],                          // ZEC  — Z15 ~420 kSol/s
  X11:        ["TH/s", "GH/s"],                   // DASH — D9 ~2.8 TH/s
  RandomX:    ["kH/s", "MH/s"],                   // XMR  — XMR-Stak ~10 kH/s
};

const FALLBACK_UNITS: HashrateUnit[] = ["TH/s", "GH/s", "MH/s", "kH/s"];

/** Units list for the given algo key (falls back to common set without kSol/s). */
function unitsFor(algo: string): HashrateUnit[] {
  return ALGO_UNITS[algo] ?? FALLBACK_UNITS;
}

/** Parse an existing hashrate string like "335 TH/s" → { value: "335", unit: "TH/s" } */
function splitHashrateString(
  s: string,
  allowedUnits: HashrateUnit[],
): { value: string; unit: HashrateUnit } {
  const fallback = allowedUnits[0];
  const m = s.match(/([\d.,]+)\s*(TH\/s|GH\/s|MH\/s|kH\/s|kSol\/s)/i);
  if (m) {
    const raw = m[2].replace(/^k/i, "k").replace(/sol/i, "Sol").replace(/\/s/i, "/s") as HashrateUnit;
    // If the parsed unit is in the allowed list, keep it; otherwise fall back.
    const unit = allowedUnits.find((u) => u.toLowerCase() === raw.toLowerCase()) ?? fallback;
    return { value: m[1], unit };
  }
  const numMatch = s.match(/([\d.,]+)/);
  return { value: numMatch ? numMatch[1] : "", unit: fallback };
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  coinPrice: number;
  coinSymbol?: string;
  /** ALGO_CONFIGS key, e.g. "SHA256" | "Scrypt" | "KHeavyHash" … */
  algo?: string;
  revenuePerTH: number;  // USD per TH-equivalent per day (spot)
  revenue24h?: number;   // 24h average (more stable for ROI calc)
  usdUah: number;        // live USD→UAH rate; electricity is entered in UAH
  initialHashrate?: string;
  initialPower?: number;
  initialPrice?: number;
}

export default function Calculator({
  coinPrice,
  coinSymbol = "BTC",
  algo = "",
  revenuePerTH,
  revenue24h,
  usdUah,
  initialHashrate = "",
  initialPower = 3500,
  initialPrice = 0,
}: Props) {
  const t = useTranslations("calculator");

  const allowedUnits = unitsFor(algo);
  const parsed       = splitHashrateString(initialHashrate, allowedUnits);

  const [hashrateValue, setHashrateValue] = useState(parsed.value);
  const [hashrateUnit,  setHashrateUnit]  = useState<HashrateUnit>(parsed.unit);
  const [powerW,           setPowerW]           = useState(initialPower);
  // Electricity tariff in UAH (грн/кВт·год); 3.6 is the mining-hotel rate.
  const [electricityRate,  setElectricityRate]  = useState(3.6);
  const [price,            setPrice]            = useState(initialPrice);

  // Compose the full hashrate string for parseHashrateTH
  const hashrateString = hashrateValue ? `${hashrateValue} ${hashrateUnit}` : "";

  const result = useMemo(() => {
    const th = parseHashrateTH(hashrateString);
    if (th <= 0 || revenuePerTH <= 0) return null;
    // Tariff is in UAH; convert the daily cost to USD to match USD revenue.
    const dailyCost    = ((powerW / 1000) * 24 * electricityRate) / usdUah;
    const dailyRevenue = revenuePerTH * th;
    const dailyProfit  = Math.max(0, dailyRevenue - dailyCost);
    // ROI uses 24h average for more stable estimate
    const rev24    = (revenue24h ?? revenuePerTH) * th;
    const profit24 = Math.max(0, rev24 - dailyCost);
    const roi      = price > 0 && profit24 > 0 ? Math.ceil(price / profit24) : Infinity;
    return {
      daily:   { cost: dailyCost,       revenue: dailyRevenue,       profit: dailyProfit       },
      monthly: { cost: dailyCost * 30,  revenue: dailyRevenue * 30,  profit: dailyProfit * 30  },
      annual:  { cost: dailyCost * 365, revenue: dailyRevenue * 365, profit: dailyProfit * 365 },
      roi,
      hasPrice: price > 0,
    };
  }, [hashrateString, powerW, electricityRate, revenuePerTH, revenue24h, price, usdUah]);

  const periods = [
    { key: "periodDay",   data: result?.daily   },
    { key: "periodMonth", data: result?.monthly  },
    { key: "periodYear",  data: result?.annual   },
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

        {/* Hashrate — numeric input + unit dropdown */}
        <div className="space-y-2">
          <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px] block">
            {t("hashrateLabel")}
          </label>

          {/* Input + dropdown row */}
          <div className="flex items-stretch gap-0 rounded-lg overflow-hidden border border-[var(--color-outline)] focus-within:border-[var(--color-primary)] transition-colors bg-[var(--color-surface-container)]">
            {/* Numeric part */}
            <input
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              value={hashrateValue}
              onChange={(e) => setHashrateValue(e.target.value)}
              placeholder={t("hashratePlaceholder")}
              className="flex-1 min-w-0 px-3 py-2.5 bg-transparent font-mono text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />

            {/* Divider */}
            <div className="w-px bg-[var(--color-outline-variant)] self-stretch" />

            {/* Unit selector */}
            <div className="relative flex items-center">
              <select
                value={hashrateUnit}
                onChange={(e) => setHashrateUnit(e.target.value as HashrateUnit)}
                className="appearance-none h-full pl-3 pr-7 bg-transparent font-mono text-sm text-primary font-semibold outline-none cursor-pointer"
                aria-label={t("hashrateUnitLabel")}
              >
                {allowedUnits.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              {/* Custom chevron */}
              <span className="pointer-events-none absolute right-2 text-primary">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
                  <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </div>
          </div>

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
            max={8.8}
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
