export const ALGO_COINS: Record<string, string[]> = {
  sha256:     ["BTC", "BCH"],
  scrypt:     ["LTC", "DOGE"],
  kheavyhash: ["KAS"],
  randomx:    ["XMR"],
  versahash:  ["ALPH"],
  x11:        ["DASH"],
  equihash:   ["ZEC", "ZEN"],
  ethhash:    ["ETC"],
  handshake:  ["HNS"],
  eaglesong:  ["CKB"],
  blake2b:    ["SC"],
};

export type CoolingType = "Повітряне" | "Hydro" | "Immersive";

export function getCoolingType(name: string): CoolingType {
  if (/hyd/i.test(name)) return "Hydro";
  if (/imm/i.test(name)) return "Immersive";
  return "Повітряне";
}
