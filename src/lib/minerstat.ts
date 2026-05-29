const API_URL = "https://api.minerstat.com/v2/coins";
const API_KEY = process.env.MINERSTAT_API_KEY ?? "ms_A90D3AB5_054c1866b22a24d93ed1fa9d14507ce520582ce2b6c8a1be";

// Minerstat normalises some algorithms to SHA256-equivalent difficulty.
// KHeavyHash (Kaspa) needs ~2e8 scaling so miner TH/s → Minerstat H/s.
// All others use native H/s matching the miner's stated unit.
const HASHRATE_FACTORS: Partial<Record<string, number>> = {
  KHeavyHash: 2e8,
};

// Map sheet algorithm names → Minerstat algorithm names
export const ALGO_NAMES: Record<string, string> = {
  SHA256:      "SHA-256",
  Scrypt:      "Scrypt",
  KHeavyHash:  "KHeavyHash",
  EthHash:     "EthHash",
  Equihash:    "Equihash",
  X11:         "X11",
  Handshake:   "Handshake",
  Eaglesong:   "Eaglesong",
  VersaHash:   "VersaHash",
  RandomX:     "RandomX",
};

export interface AlgoRevenue {
  revenuePerTH: number; // USD per TH-equivalent per day
  coin: string;         // canonical coin ticker
  coinPrice: number;    // USD
}

interface MinerstatCoin {
  coin: string;
  type: string;
  algorithm: string;
  reward: number;  // coins per H/s per hour
  price: number;   // USD
  volume: number;
  network_hashrate: number;
}

export async function getMinerstatRevenue(): Promise<Record<string, AlgoRevenue>> {
  try {
    const res = await fetch(`${API_URL}?key=${API_KEY}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return {};

    const coins: MinerstatCoin[] = await res.json();
    const result: Record<string, AlgoRevenue> = {};

    for (const [ourAlgo, msAlgo] of Object.entries(ALGO_NAMES)) {
      const candidates = coins.filter(
        (c) => c.algorithm === msAlgo && c.type === "coin" && c.reward > 0 && c.price > 0
      );
      if (!candidates.length) continue;

      // Pick the coin with highest hourly USD revenue per H/s
      const best = candidates.reduce((a, b) =>
        a.reward * a.price > b.reward * b.price ? a : b
      );

      const factor = HASHRATE_FACTORS[msAlgo] ?? 1;

      // revenue = reward (coins/H/hour) × 1e12 (H per TH) × factor × 24h × price
      const revenuePerTH = best.reward * 1e12 * factor * 24 * best.price;

      result[ourAlgo] = {
        revenuePerTH,
        coin: best.coin,
        coinPrice: best.price,
      };
    }

    return result;
  } catch {
    return {};
  }
}
