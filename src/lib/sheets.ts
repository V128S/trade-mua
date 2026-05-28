export interface Product {
  id: string;
  algorithm: string;
  name: string;
  hashrate: string;
  powerW: number;
  priceUSDT: number;
  inStock: boolean;
  isNew: boolean;
}

const SHEETS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1AKD5vyhUgzxlA04p7W7c3ZrMscHEbeflsmtp6evB48w/export?format=csv";

const BRANDS = [
  "Antminer", "Whatsminer", "Elphapex", "Fluminer",
  "Volcminer", "Pinecone", "Avalon", "AVALON",
];

// Algorithms extracted from the start of combined column A
const ALGO_PREFIXES = [
  "SHA256", "Scrypt", "KHeavyHash", "VersaHash",
  "EtHash", "Blake2B", "X11", "Eaglesong",
];

function cleanEmoji(s: string): string {
  return s.replace(/[\u{1F300}-\u{1FFFF}]/gu, "").replace(/🔥/g, "").trim();
}

function parseRow(cols: string[]): Product | null {
  const raw = (cols[0] ?? "").trim();
  const powerRaw = (cols[1] ?? "").trim();
  const stockPriceRaw = (cols[2] ?? "").trim();
  const orderPriceRaw = (cols[3] ?? "").trim();

  const powerW = Number(powerRaw);
  if (!raw || !powerRaw || isNaN(powerW) || powerW === 0) return null;

  const stockPrice = Number(stockPriceRaw) || 0;
  const orderPrice = Number(orderPriceRaw) || 0;
  const priceUSDT = stockPrice || orderPrice;
  if (!priceUSDT) return null;

  const inStock = stockPrice > 0;
  const isNew = raw.includes("НОВИНКА") || raw.includes("новинка");
  const cleaned = cleanEmoji(raw);

  // Split algorithm from model name
  let algorithm = "";
  let modelFull = cleaned;

  for (const brand of BRANDS) {
    const idx = cleaned.indexOf(brand);
    if (idx > 0) {
      const algoRaw = cleaned.substring(0, idx);
      algorithm = ALGO_PREFIXES.find((p) => algoRaw.includes(p)) ?? algoRaw.replace(/\s*-\s*НОВИНКА\s*/gi, "").trim();
      modelFull = cleaned.substring(idx).trim();
      break;
    }
  }

  // Extract hashrate from end of model name (e.g. "473Th", "20 GH/s", "45T")
  const hashrateMatch = modelFull.match(/(\d[\d.,]*\s*(?:TH\/s|GH\/s|MH\/s|Th|Gh|Mh|T|G|M))\s*$/i);
  const hashrate = hashrateMatch ? hashrateMatch[1].trim() : "";

  return {
    id: `${modelFull}-${powerW}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
    algorithm: algorithm || "SHA256",
    name: modelFull,
    hashrate,
    powerW,
    priceUSDT,
    inStock,
    isNew,
  };
}

// Parse raw CSV text into rows, handling quoted fields
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.split("\n");

  for (const line of lines) {
    const cols: string[] = [];
    let cur = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuote = !inQuote;
      } else if (ch === "," && !inQuote) {
        cols.push(cur);
        cur = "";
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
    const res = await fetch(SHEETS_CSV_URL, {
      next: { revalidate: 3600 }, // re-fetch every hour
    });
    if (!res.ok) return [];
    const text = await res.text();
    const rows = parseCsv(text);

    const products: Product[] = [];
    for (const row of rows) {
      const p = parseRow(row);
      if (p) products.push(p);
    }
    return products;
  } catch {
    return [];
  }
}

export async function getTopProducts(limit = 8): Promise<Product[]> {
  const all = await getProducts();
  // TOP section products come first in the sheet — take the first `limit`
  return all.slice(0, limit);
}
