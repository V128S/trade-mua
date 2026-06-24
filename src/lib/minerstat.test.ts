import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getMinerstatRevenue } from "./minerstat";

describe("getMinerstatRevenue", () => {
  beforeEach(() => {
    vi.stubEnv("WHATTOMINE_API_KEY", "test-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("successfully fetches from calculate API when key is valid", async () => {
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
    expect(res.SHA256.coin).toBe("BTC");
    expect(res.SHA256.coinPrice).toBeCloseTo(62068, -1);
    expect(res.SHA256.revenuePerTH).toBe(18.0);
    expect(res.SHA256.revenue24h).toBe(18.2);
    expect(res.EthHash).toBeDefined();
    expect(res.EthHash.coin).toBe("ETC");
  });

  it("falls back to public asic.json when calculate API fails (429)", async () => {
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
        }
      }
    };

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
    expect(res.SHA256).toBeDefined();
    expect(res.SHA256.coin).toBe("BTC");
    expect(res.SHA256.coinPrice).toBe(60000);
    expect(res.SHA256.revenuePerTH).toBeCloseTo(0.027, 3);
  });
});
