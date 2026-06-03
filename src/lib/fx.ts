// USD → UAH exchange rate from the National Bank of Ukraine (free, no API key).
// Used by the profitability calculator: the electricity tariff is entered in UAH
// (грн/кВт·год) while mining revenue from WhatToMine is denominated in USD, so we
// convert the UAH cost to USD before subtracting it from revenue.

const NBU_URL =
  "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&json";

// Fallback if the NBU API is unreachable. Keep roughly in line with the market so
// the calculator stays sane on a cold/failed fetch.
const FALLBACK_USD_UAH = 41.5;

/** Live USD→UAH rate (грн per $1). Cached ~6h; falls back to a constant on error. */
export async function getUsdUahRate(): Promise<number> {
  try {
    const res = await fetch(NBU_URL, { next: { revalidate: 21600 } });
    if (!res.ok) return FALLBACK_USD_UAH;
    const data = (await res.json()) as Array<{ rate?: number }>;
    const rate = data?.[0]?.rate;
    return typeof rate === "number" && rate > 0 ? rate : FALLBACK_USD_UAH;
  } catch {
    return FALLBACK_USD_UAH;
  }
}
