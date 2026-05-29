export interface Product {
  id: string;
  algorithm: string;
  brand: string;
  name: string;     // brand + model (no hashrate)
  hashrate: string;
  powerW: number;
  priceUSDT: number;
  inStock: boolean;
  isNew: boolean;
}

const SHEETS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1mfpuFvJMgQ-VMZlD7gUbqkxtOA5libclgxHsQBn-UPQ/export?format=csv&gid=1046763892";

const KNOWN_ALGOS = new Set([
  "sha256", "scrypt", "kheavyhash", "versahash", "randomx",
  "x11", "equihash", "ethhash", "handshake", "eaglesong", "blake2b",
]);

const BRAND_MAP: Record<string, string> = {
  antminer: "ant", avalon: "avl", fluminer: "flu", elphapex: "elp",
  volcminer: "vlc", pinecone: "pin", whatsminer: "wm", jasminer: "jas", bombax: "bmx",
};

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function parsePriceStr(s: string): number {
  return parseFloat(s.replace(/,/g, ".").replace(/[^\d.]/g, "")) || 0;
}

// WhatsMiner uses W/T (efficiency) instead of absolute watts — calculate from hashrate
function parseWatts(powerRaw: string, hashrateRaw: string): number {
  const s = powerRaw.trim();
  const wtMatch = s.match(/^([\d.]+)\s*W\/T$/i);
  if (wtMatch) {
    const efficiency = parseFloat(wtMatch[1]);
    const thMatch = hashrateRaw.match(/([\d.,]+)\s*TH/i);
    if (thMatch) return Math.round(parseFloat(thMatch[1].replace(",", ".")) * efficiency);
    return 0;
  }
  return parseFloat(s.replace(",", ".")) || 0;
}

function autoSlug(firm: string, model: string, hashrate: string): string {
  const brand = BRAND_MAP[firm.toLowerCase().replace(/\s/g, "")] ?? slug(firm).slice(0, 4);
  const hr = hashrate.toLowerCase()
    .replace(/\s/g, "")
    .replace("th/s", "th").replace("gh/s", "gh")
    .replace("mh/s", "mh").replace("kh/s", "kh")
    .replace("ph/s", "ph");
  return `${brand}-${slug(model)}-${hr}`;
}

// Columns: [0]algo [1]firm [2]model [3]hashrate [4]power [5]instock [6]order [7]notes [8]sku
function parseRow(cols: string[]): Product | null {
  const algo     = cols[0]?.trim() ?? "";
  const firm     = cols[1]?.trim() ?? "";
  const model    = cols[2]?.trim() ?? "";
  const hashrate = cols[3]?.trim() ?? "";
  const powerRaw = cols[4]?.trim() ?? "";
  const inStockRaw = cols[5]?.trim() ?? "";
  const orderRaw   = cols[6]?.trim() ?? "";
  const sku        = cols[8]?.trim() ?? "";

  if (!KNOWN_ALGOS.has(algo.toLowerCase())) return null;
  if (!firm || !model || !hashrate || !powerRaw) return null;

  const powerW = parseWatts(powerRaw, hashrate);
  if (!powerW) return null;

  const stockPrice = parsePriceStr(inStockRaw);
  const orderPrice = parsePriceStr(orderRaw);
  const priceUSDT  = stockPrice || orderPrice;
  if (!priceUSDT) return null;

  return {
    id:        sku || autoSlug(firm, model, hashrate),
    algorithm: algo,
    brand:     firm,
    name:      `${firm} ${model}`,
    hashrate,
    powerW,
    priceUSDT,
    inStock:   stockPrice > 0,
    isNew:     /новинка/i.test(model),
  };
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  for (const line of lines) {
    const cols: string[] = [];
    let cur = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuote = !inQuote;
      } else if (ch === "," && !inQuote) {
        cols.push(cur); cur = "";
      } else {
        cur += ch;
      }
    }
    cols.push(cur);
    rows.push(cols);
  }
  return rows;
}

export async function getProducts(): Promise<Product[]> {
  try {
    const res = await fetch(SHEETS_CSV_URL, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const rows = parseCsv(await res.text());

    const seen = new Set<string>();
    const products: Product[] = [];
    for (const row of rows) {
      const p = parseRow(row);
      if (!p || seen.has(p.id)) continue;
      seen.add(p.id);
      products.push(p);
    }
    return products;
  } catch {
    return [];
  }
}

export async function getTopProducts(limit = 8): Promise<Product[]> {
  return (await getProducts()).slice(0, limit);
}
