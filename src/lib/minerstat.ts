// Data source: WhatToMine (free, no API key) + CoinGecko for BTC price
const WTM_URL = "https://whattomine.com/coins.json";
const GECKO_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd";

// Map our algorithm names → WhatToMine algorithm names
export const ALGO_NAMES: Record<string, string> = {
  SHA256:     "SHA-256",
  Scrypt:     "Scrypt",
  KHeavyHash: "KHeavyHash",
  EthHash:    "Ethash",
  Equihash:   "Equihash",
  X11:        "X11",
  Handshake:  "Handshake",
  Eaglesong:  "Eaglesong",
  RandomX:    "RandomX",
};

// Preferred coin tickers per algorithm (tried in order, first found wins)
const ALGO_COINS: Record<string, string[]> = {
  SHA256:     ["BTC"],
  Scrypt:     ["DOGE", "LTC"],
  KHeavyHash: ["KAS"],
  EthHash:    ["ETC"],
  Equihash:   ["ZEC"],
  X11:        ["DASH"],
  Handshake:  ["HNS"],
  Eaglesong:  ["CKB"],
  RandomX:    ["XMR"],
};

export interface AlgoRevenue {
  revenuePerTH: number; // USD per TH-equivalent per day
  coin: string;
  coinPrice: number;    // USD
}

interface WtmCoin {
  tag: string;
  algorithm: string;
  block_time: string;
  block_reward: number;
  nethash: number;
  exchange_rate: number;      // coin → BTC (or USD if exchange_rate_curr === "USD")
  exchange_rate_curr: string;
  status: string;
}

export async function getMinerstatRevenue(): Promise<Record<string, AlgoRevenue>> {
  try {
    const [wtmRes, geckoRes] = await Promise.all([
      fetch(WTM_URL, { next: { revalidate: 300 } }),
      fetch(GECKO_URL, { next: { revalidate: 300 } }),
    ]);

    if (!wtmRes.ok) return {};

    const wtmData = (await wtmRes.json()) as { coins: Record<string, WtmCoin> };
    const geckoData = geckoRes.ok ? (await geckoRes.json()) : {};
    const btcUsd: number = (geckoData as { bitcoin?: { usd?: number } })?.bitcoin?.usd ?? 0;

    if (!btcUsd) return {};

    const allCoins = Object.values(wtmData.coins);
    const result: Record<string, AlgoRevenue> = {};

    for (const [ourAlgo, wtmAlgo] of Object.entries(ALGO_NAMES)) {
      const preferred = ALGO_COINS[ourAlgo] ?? [];

      // Try preferred tickers first
      let coin: WtmCoin | undefined;
      for (const ticker of preferred) {
        coin = allCoins.find(
          (c) =>
            c.tag === ticker &&
            c.nethash > 0 &&
            parseFloat(c.block_time) > 0 &&
            c.exchange_rate > 0
        );
        if (coin) break;
      }

      // Fallback: any active coin matching algorithm name
      if (!coin) {
        coin = allCoins.find(
          (c) =>
            c.algorithm === wtmAlgo &&
            c.status === "Active" &&
            c.nethash > 0 &&
            parseFloat(c.block_time) > 0 &&
            c.exchange_rate > 0
        );
      }

      if (!coin) continue;

      const coinPriceUSD =
        coin.exchange_rate_curr === "USD"
          ? coin.exchange_rate
          : coin.exchange_rate * btcUsd;

      const blockTime = parseFloat(coin.block_time);

      // Universal mining revenue formula:
      //   miner_share = hashrate_H_s / network_hashrate_H_s
      //   daily_coins = miner_share * (86400 / block_time) * block_reward
      //   daily_usd   = daily_coins * coin_price
      //
      // For 1 TH/s (1e12 H/s):
      //   revenuePerTH = (1e12 / nethash) * (86400 / block_time) * block_reward * price
      const revenuePerTH =
        (1e12 / coin.nethash) * (86400 / blockTime) * coin.block_reward * coinPriceUSD;

      result[ourAlgo] = {
        revenuePerTH,
        coin: coin.tag,
        coinPrice: coinPriceUSD,
      };
    }

    return result;
  } catch {
    return {};
  }
}
