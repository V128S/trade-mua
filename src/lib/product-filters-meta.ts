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

// Curated popularity order — the most in-demand model families first.
// Tokens are matched case-insensitively as substrings of the product name,
// top-down: the FIRST match wins, so more specific tokens (e.g. "s21 xp")
// MUST precede broader ones ("s21"). Products with no match sort last.
//
// This is intentionally model-based, NOT a DB column, so it survives the
// Google-Sheet → Supabase resync (which would wipe any per-row flag). To
// re-rank the catalog, just reorder this list.
export const POPULARITY_ORDER: readonly string[] = [
  "s21 pro",   // Antminer S21 Pro — найходовіший BTC-флагман
  "s21e xp",   // S21E XP Hyd 3U
  "s21j xp",   // S21j XP+ Hyd
  "s21 xp",    // S21 XP Hyd / Hydro
  "s21xp",     // S21XP / S21XP IMM (без пробілу)
  "s21+",      // S21+ / S21+ Hyd / Hydro
  "s21e",      // S21e Hyd
  "s21",       // S21 / S21 IMM (базова модель)
  "l9",        // Antminer L9 — топ для LTC/DOGE
  "ks7",       // Antminer KS7 — Kaspa
  "s23",       // S23 — новий флагман (дорогий, нішевий попит)
  "s19",       // S19 XP / S19K Pro — бюджетний вхід у BTC
  "avalon",    // Avalon Q / Nano / Mini — домашній майнінг
  "l11",       // Antminer L11
  "l7",        // Antminer L7
  "elphapex",  // ElphaPex DG
  "fluminer",  // власний бренд FluMiner
  "z15",       // Z15 Pro — Zcash
  "e11",       // E11 — EthHash
  "d9",        // D9 — Dash
  "pinecone",  // Pinecone
  "volcminer", // VolcMiner
];

// Popularity rank by product name → smaller = more popular.
// Unmatched models fall to the end (rank === POPULARITY_ORDER.length).
export function getPopularityRank(name: string): number {
  const n = name.toLowerCase();
  const i = POPULARITY_ORDER.findIndex((token) => n.includes(token));
  return i === -1 ? POPULARITY_ORDER.length : i;
}
