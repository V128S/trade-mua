// Primary: WhatToMine API v1 /calculate
// Fallback (EthHash only): CoinGecko + formula

const WTM_URL = "https://whattomine.com/api/v1/calculate";

export const ALGO_NAMES: Record<string, string> = {
  SHA256:     "SHA-256",
  Scrypt:     "Scrypt",
  KHeavyHash: "KHeavyHash",
  EthHash:    "Etchash",
  Eaglesong:  "Eaglesong",
  Equihash:   "Equihash",
  X11:        "X11",
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

interface PublicWtmCoin {
  tag: string;
  nethash: number;
  block_time: string;
  block_reward: number;
  block_reward24: number;
  exchange_rate: number;
  exchange_rate24: number;
}

function getUnitHashrate(refUnit: string): number {
  const match = refUnit.match(/^(\d+)([TGMK])$/i);
  if (!match) return 1;
  const val = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  if (unit === "T") return val * 1e12;
  if (unit === "G") return val * 1e9;
  if (unit === "M") return val * 1e6;
  if (unit === "K") return val * 1e3;
  return val;
}

async function getPublicAsicRevenue(): Promise<Record<string, AlgoRevenue>> {
  try {
    const res = await fetch("https://whattomine.com/asic.json", { next: { revalidate: 300 } });
    if (!res.ok) return {};
    const data = await res.json() as { coins: Record<string, PublicWtmCoin> };
    if (!data || !data.coins) return {};

    const btcCoin = data.coins["Bitcoin"];
    if (!btcCoin) return {};
    const btcPrice = btcCoin.exchange_rate;
    const btcPrice24 = btcCoin.exchange_rate24;

    const result: Record<string, AlgoRevenue> = {};

    for (const [algo, cfg] of Object.entries(ALGO_CONFIGS)) {
      const matches = cfg.coinNames
        .map((name) => {
          const coinData = data.coins[name];
          if (!coinData) return null;
          const isBtc = name === "Bitcoin";
          const coinBtcPrice = isBtc ? 1 : coinData.exchange_rate;
          const coinBtcPrice24 = isBtc ? 1 : coinData.exchange_rate24;
          const coinPrice = coinBtcPrice * btcPrice;
          
          const unitHashrate = getUnitHashrate(cfg.refUnit);
          const blockTime = parseFloat(coinData.block_time);
          if (!coinData.nethash || !blockTime) return null;

          const reward = (unitHashrate / coinData.nethash) * (86400 / blockTime) * coinData.block_reward;
          const reward24 = (unitHashrate / coinData.nethash) * (86400 / blockTime) * coinData.block_reward24;

          const revenue = reward * coinBtcPrice * btcPrice;
          const revenue24 = reward24 * coinBtcPrice24 * btcPrice24;

          return {
            tag: coinData.tag,
            revenue,
            revenue24,
            coinPrice,
          };
        })
        .filter((c): c is { tag: string; revenue: number; revenue24: number; coinPrice: number } => !!c);

      if (!matches.length) continue;

      const primary = matches[0];
      const totalRev = cfg.mergeMine
        ? matches.reduce((s, c) => s + c.revenue, 0)
        : primary.revenue;
      const totalRev24 = cfg.mergeMine
        ? matches.reduce((s, c) => s + c.revenue24, 0)
        : primary.revenue24;

      result[algo] = {
        revenuePerTH: totalRev * cfg.scaleToTH,
        revenue24h:   totalRev24 * cfg.scaleToTH,
        coin:         primary.tag,
        coinPrice:    primary.coinPrice,
      };
    }

    return result;
  } catch {
    return {};
  }
}

export async function getMinerstatRevenue(): Promise<Record<string, AlgoRevenue>> {
  const wtmKey = process.env.WHATTOMINE_API_KEY;
  // No key → skip the WhatToMine call. EthHash fallback (CoinGecko) still works.
  if (!wtmKey) {
    const [publicData, ethHashData] = await Promise.all([
      getPublicAsicRevenue(),
      getEthHashFallback(),
    ]);
    if (ethHashData) {
      publicData.EthHash = ethHashData;
    }
    return publicData;
  }
  try {
    // Single API call with all algorithms + their reference hashrates
    const algoQuery = Object.values(ALGO_CONFIGS)
      .map((c) => `${c.param}=0|${c.refUnit}`)
      .join("&");
    const url = `${WTM_URL}?${algoQuery}&cost=0&api_token=${wtmKey}`;

    const [wtmRes, ethHashData] = await Promise.all([
      fetch(url, { next: { revalidate: 300 } }),
      getEthHashFallback(),
    ]);

    if (!wtmRes.ok) {
      const publicData = await getPublicAsicRevenue();
      if (ethHashData) {
        publicData.EthHash = ethHashData;
      }
      return publicData;
    }

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
    try {
      const [publicData, ethHashData] = await Promise.all([
        getPublicAsicRevenue(),
        getEthHashFallback(),
      ]);
      if (ethHashData) {
        publicData.EthHash = ethHashData;
      }
      return publicData;
    } catch {
      return {};
    }
  }
}
