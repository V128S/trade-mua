import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getMinerstatRevenue } from "./minerstat";

// Shared mock for asic.json that includes EthereumClassic
const mockAsicData = {
  coins: {
    Bitcoin: {
      tag: "BTC",
      nethash: 1e21,
      block_time: "600",
      block_reward: 3.125,
      block_reward24: 3.12,
      exchange_rate: 60000,
      exchange_rate24: 59500,
    },
    EthereumClassic: {
      tag: "ETC",
      nethash: 2e14,
      block_time: "13",
      block_reward: 2.56,
      block_reward24: 2.55,
      exchange_rate: 0.0001,        // 0.0001 BTC/ETC
      exchange_rate24: 0.000099,
    },
  },
};

describe("getMinerstatRevenue", () => {
  beforeEach(() => {
    vi.stubEnv("WHATTOMINE_API_KEY", "test-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("successfully fetches from calculate API when key is valid; EthHash from asic.json", async () => {
    const mockWtmCoins = [
      {
        id: 1,
        name: "Bitcoin",
        tag: "BTC",
        estimated_rewards: "0.00029",
        revenue: "18.0",
        revenue24: "18.2",
        btc_revenue: "0.00029",
        btc_revenue24: "0.00029",
        profit: "15.0",
      }
    ];

    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      const uStr = url.toString();
      if (uStr.includes("calculate")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockWtmCoins),
        } as Response);
      }
      if (uStr.includes("asic.json")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockAsicData),
        } as Response);
      }
      // CoinGecko should NOT be called now (asic.json is the primary EthHash source)
      if (uStr.includes("coingecko")) {
        return Promise.reject(new Error("CoinGecko should not be called when asic.json is available"));
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    const res = await getMinerstatRevenue();
    expect(res.SHA256).toBeDefined();
    expect(res.SHA256.coin).toBe("BTC");
    expect(res.SHA256.coinPrice).toBeCloseTo(62068, -1);
    expect(res.SHA256.revenuePerTH).toBe(18.0);
    expect(res.SHA256.revenue24h).toBe(18.2);

    // EthHash is now sourced from asic.json EthereumClassic, not CoinGecko
    expect(res.EthHash).toBeDefined();
    expect(res.EthHash.coin).toBe("ETC");
    // ETC price = exchange_rate * BTC_USD = 0.0001 * 60000 = $6
    expect(res.EthHash.coinPrice).toBeCloseTo(6, 0);
    // revenuePerTH = (1e12 / 2e14) * (86400/13) * 2.56 * 0.0001 * 60000
    const expectedEthHashRev = (1e12 / 2e14) * (86400 / 13) * 2.56 * 0.0001 * 60000;
    expect(res.EthHash.revenuePerTH).toBeCloseTo(expectedEthHashRev, 0);
  });

  it("falls back to public asic.json (all coins incl. EthHash) when calculate API fails (429)", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      const uStr = url.toString();
      if (uStr.includes("calculate")) {
        return Promise.resolve({
          ok: false,
          status: 429,
        } as Response);
      }
      if (uStr.includes("asic.json")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockAsicData),
        } as Response);
      }
      if (uStr.includes("coingecko")) {
        return Promise.resolve({
          ok: false,
          status: 500,
        } as Response);
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    const res = await getMinerstatRevenue();

    // SHA256 (Bitcoin) from asic.json
    expect(res.SHA256).toBeDefined();
    expect(res.SHA256.coin).toBe("BTC");
    expect(res.SHA256.coinPrice).toBe(60000);
    // revenuePerTH = (1e12/1e21) * (86400/600) * 3.125 * 1 * 60000
    expect(res.SHA256.revenuePerTH).toBeCloseTo(0.027, 3);

    // EthHash (EthereumClassic) from asic.json — no CoinGecko needed
    expect(res.EthHash).toBeDefined();
    expect(res.EthHash.coin).toBe("ETC");
    expect(res.EthHash.coinPrice).toBeCloseTo(6, 0);
    const expectedEthHashRev = (1e12 / 2e14) * (86400 / 13) * 2.56 * 0.0001 * 60000;
    expect(res.EthHash.revenuePerTH).toBeCloseTo(expectedEthHashRev, 0);
  });

  it("uses CoinGecko as last-resort EthHash fallback when asic.json also lacks EthereumClassic", async () => {
    vi.stubEnv("WHATTOMINE_API_KEY", ""); // no key → goes straight to asic.json path

    const asicWithoutEtc = {
      coins: {
        Bitcoin: mockAsicData.coins.Bitcoin,
        // EthereumClassic intentionally absent
      },
    };

    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      const uStr = url.toString();
      if (uStr.includes("asic.json")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(asicWithoutEtc),
        } as Response);
      }
      if (uStr.includes("coingecko")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ "ethereum-classic": { usd: 20 } }),
        } as Response);
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    const res = await getMinerstatRevenue();
    expect(res.SHA256).toBeDefined();
    // EthHash comes from CoinGecko fallback with hardcoded formula
    expect(res.EthHash).toBeDefined();
    expect(res.EthHash.coin).toBe("ETC");
    expect(res.EthHash.coinPrice).toBe(20);
    const expectedCgRev = (1e12 / 2e14) * (86400 / 13) * 2.56 * 20;
    expect(res.EthHash.revenuePerTH).toBeCloseTo(expectedCgRev, 0);
  });
});
