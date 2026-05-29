// Primary: WhatToMine API v1 /calculate
// Fallback (EthHash only): CoinGecko + formula

const WTM_KEY = process.env.WHATTOMINE_API_KEY ?? "7620ec9bede1243fb97c8b2b46c23b5b48df74ad21e16f6ae8e5eedfae5e17c2";
const WTM_URL = "https://whattomine.com/api/v1/calculate";

export const ALGO_NAMES: Record<string, string> = {
  SHA256:     "SHA-256",
  Scrypt:     "Scrypt",
  KHeavyHash: "KHeavyHash",
  EthHash:    "Etchash",
  Eaglesong:  "Eaglesong",
  Equihash:   "Equihash",
  X11:        "X11",
  Handshake:  "Handshake",
  RandomX:    "RandomX",
};

export interface AlgoRevenue {
  revenuePerTH: number; // USD per TH-equivalent per day
  coin: string;
  coinPrice: number;    // USD (derived from WTM revenue / estimated_rewards)
  revenue24h: number;   // 24h average revenue per TH (more stable)
}

// WhatToMine calculate response item
interface WtmCoin {
  id: number;
  tag: string;
  name: string;
  estimated_rewards: string;  // coins per day at reference hashrate
  btc_revenue: string;
  btc_revenue24: string;
  revenue: string;            // USD per day at reference hashrate
  revenue24: string;          // 24h average USD per day
  profit: string;
}

// Per-algorithm config:
//   param     — WhatToMine API parameter name
//   refUnit   — reference hashrate (1T = 1 TH/s, 1G = 1 GH/s, 1K = 1 kH/s)
//   scaleToTH — multiply WTM revenue by this to get revenuePerTH
//               (because parseHashrateTH returns TH-equivalents)
//               sha256/hh/esg/hk with 1T ref: scale=1 (already per TH)
//               scrypt/x11    with 1G ref: scale=1000 (1GH = 0.001 TH)
//               eq/rmx        with 1K ref: scale=1e9  (1kH = 1e-9 TH)
//   coinNames — coin names as returned by WhatToMine (for matching response)
//   mergeMine — true = sum revenues of all matching coins (e.g. DOGE+LTC)
interface AlgoConfig {
  param: string;
  refUnit: string;
  scaleToTH: number;
  coinNames: string[];
  mergeMine?: boolean;
}

const ALGO_CONFIGS: Record<string, AlgoConfig> = {
  SHA256:     { param: "sha256", refUnit: "1T", scaleToTH: 1,    coinNames: ["Bitcoin"]                     },
  Scrypt:     { param: "scrypt", refUnit: "1G", scaleToTH: 1000, coinNames: ["Dogecoin", "Litecoin"], mergeMine: true },
  KHeavyHash: { param: "hh",     refUnit: "1T", scaleToTH: 1,    coinNames: ["Kaspa"]                      },
  Eaglesong:  { param: "esg",    refUnit: "1T", scaleToTH: 1,    coinNames: ["Nervos"]                     },
  Equihash:   { param: "eq",     refUnit: "1K", scaleToTH: 1e9,  coinNames: ["Zcash", "Pirate"]            },
  X11:        { param: "x11",    refUnit: "1G", scaleToTH: 1000, coinNames: ["Dash"]                       },
  Handshake:  { param: "hk",     refUnit: "1T", scaleToTH: 1,    coinNames: ["Handshake"]                  },
  RandomX:    { param: "rmx",    refUnit: "1K", scaleToTH: 1e9,  coinNames: ["Monero"]                     },
};

// EthHash fallback: WhatToMine doesn't have Etchash (ETC) in its calculate endpoint.
// Use CoinGecko price + hardcoded network stats.
async function getEthHashFallback(): Promise<AlgoRevenue | null> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum-classic&vs_currencies=usd",
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const data = await res.json() as { "ethereum-classic"?: { usd?: number } };
    const price = data["ethereum-classic"]?.usd;
    if (!price) return null;
    // ETC Etchash: ~200 TH/s network, 13s blocks, 2.56 ETC reward
    const revenuePerTH = (1e12 / 2e14) * (86400 / 13) * 2.56 * price;
    return { revenuePerTH, coin: "ETC", coinPrice: price, revenue24h: revenuePerTH };
  } catch {
    return null;
  }
}

export async function getMinerstatRevenue(): Promise<Record<string, AlgoRevenue>> {
  try {
    // Single API call with all algorithms + their reference hashrates
    const algoQuery = Object.values(ALGO_CONFIGS)
      .map((c) => `${c.param}=0|${c.refUnit}`)
      .join("&");
    const url = `${WTM_URL}?${algoQuery}&cost=0&api_token=${WTM_KEY}`;

    const [wtmRes, ethHashData] = await Promise.all([
      fetch(url, { next: { revalidate: 300 } }),
      getEthHashFallback(),
    ]);

    if (!wtmRes.ok) return {};

    const coins: WtmCoin[] = await wtmRes.json();

    // Index coins by name for O(1) lookup
    const byName = new Map<string, WtmCoin>();
    for (const c of coins) byName.set(c.name, c);

    const result: Record<string, AlgoRevenue> = {};

    for (const [algo, cfg] of Object.entries(ALGO_CONFIGS)) {
      const matches = cfg.coinNames
        .map((n) => byName.get(n))
        .filter((c): c is WtmCoin => !!c && parseFloat(c.revenue) > 0);

      if (!matches.length) continue;

      const primary = matches[0];

      // For merge-mined algos, sum revenues; otherwise take primary
      const totalRev = cfg.mergeMine
        ? matches.reduce((s, c) => s + parseFloat(c.revenue), 0)
        : parseFloat(primary.revenue);

      const totalRev24 = cfg.mergeMine
        ? matches.reduce((s, c) => s + parseFloat(c.revenue24), 0)
        : parseFloat(primary.revenue24);

      // Derive spot price from WTM data: price = revenue / estimated_rewards
      const rewards = parseFloat(primary.estimated_rewards);
      const coinPrice = rewards > 0 ? parseFloat(primary.revenue) / rewards : 0;

      result[algo] = {
        revenuePerTH: totalRev * cfg.scaleToTH,
        revenue24h:   totalRev24 * cfg.scaleToTH,
        coin:         primary.tag,
        coinPrice,
      };
    }

    // EthHash: WhatToMine doesn't cover ETC Etchash → fallback
    if (ethHashData) {
      result.EthHash = ethHashData;
    }

    return result;
  } catch {
    return {};
  }
}
