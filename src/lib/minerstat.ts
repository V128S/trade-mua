// Free data sources: CoinGecko (prices) + blockchain.info (live BTC hashrate)
// No API keys required.

const GECKO_URL = "https://api.coingecko.com/api/v3/simple/price";
const BTC_HASHRATE_URL = "https://blockchain.info/q/hashrate"; // returns GH/s plain text

export const ALGO_NAMES: Record<string, string> = {
  SHA256:     "SHA-256",
  Scrypt:     "Scrypt",
  KHeavyHash: "KHeavyHash",
  EthHash:    "Etchash",
  Equihash:   "Equihash",
  X11:        "X11",
  Handshake:  "Handshake",
  Eaglesong:  "Eaglesong",
  RandomX:    "RandomX",
};

export interface AlgoRevenue {
  revenuePerTH: number; // USD per TH-equivalent per day
  coin: string;
  coinPrice: number;    // USD
}

interface AlgoStats {
  blockTime: number;    // seconds per block
  blockReward: number;  // coins per block
  nethash: number;      // H/s (algorithm-native units, same unit as miner specs)
  geckoId: string;
  ticker: string;
}

// Network stats snapshot — update quarterly if significantly off.
// nethash is in H/s of the algorithm's native unit (matches miner hashrate specs).
// SHA256 nethash is overridden at runtime from blockchain.info.
const ALGO_STATS: Record<string, AlgoStats> = {
  SHA256:     { blockTime: 600,  blockReward: 3.125,  nethash: 7e20,   geckoId: "bitcoin",          ticker: "BTC"  },
  Scrypt:     { blockTime: 60,   blockReward: 10000,  nethash: 8e14,   geckoId: "dogecoin",         ticker: "DOGE" },
  KHeavyHash: { blockTime: 1,    blockReward: 80,     nethash: 9e17,   geckoId: "kaspa",            ticker: "KAS"  },
  EthHash:    { blockTime: 13,   blockReward: 2.56,   nethash: 2e14,   geckoId: "ethereum-classic", ticker: "ETC"  },
  Equihash:   { blockTime: 75,   blockReward: 3.125,  nethash: 1e10,   geckoId: "zcash",            ticker: "ZEC"  },
  X11:        { blockTime: 158,  blockReward: 1.71,   nethash: 5e15,   geckoId: "dash",             ticker: "DASH" },
  Handshake:  { blockTime: 600,  blockReward: 2000,   nethash: 1e18,   geckoId: "handshake",        ticker: "HNS"  },
  Eaglesong:  { blockTime: 10,   blockReward: 1917,   nethash: 2e17,   geckoId: "nervos-network",   ticker: "CKB"  },
  RandomX:    { blockTime: 120,  blockReward: 0.6,    nethash: 3e9,    geckoId: "monero",           ticker: "XMR"  },
};

export async function getMinerstatRevenue(): Promise<Record<string, AlgoRevenue>> {
  try {
    const geckoIds = [...new Set(Object.values(ALGO_STATS).map((s) => s.geckoId))];
    const geckoUrl = `${GECKO_URL}?ids=${geckoIds.join(",")}&vs_currencies=usd`;

    const [geckoRes, btcHashRes] = await Promise.all([
      fetch(geckoUrl, { next: { revalidate: 300 } }),
      fetch(BTC_HASHRATE_URL, { next: { revalidate: 300 } }),
    ]);

    if (!geckoRes.ok) return {};
    const prices = (await geckoRes.json()) as Record<string, { usd: number }>;

    // Override BTC nethash with live value if available
    let btcNethash = ALGO_STATS.SHA256.nethash;
    if (btcHashRes.ok) {
      const ghVal = parseFloat((await btcHashRes.text()).trim());
      if (ghVal > 0) btcNethash = ghVal * 1e9; // GH/s → H/s
    }

    const result: Record<string, AlgoRevenue> = {};

    for (const [algo, stats] of Object.entries(ALGO_STATS)) {
      const coinPrice = prices[stats.geckoId]?.usd;
      if (!coinPrice) continue;

      const nethash = algo === "SHA256" ? btcNethash : stats.nethash;

      // Universal mining revenue formula:
      //   miner_share = 1e12 H/s / network_hashrate_H/s
      //   daily_coins = miner_share × (86400 / block_time) × block_reward
      //   revenuePerTH = daily_coins × coin_price_usd
      const revenuePerTH =
        (1e12 / nethash) * (86400 / stats.blockTime) * stats.blockReward * coinPrice;

      result[algo] = { revenuePerTH, coin: stats.ticker, coinPrice };
    }

    return result;
  } catch {
    return {};
  }
}
