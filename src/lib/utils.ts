export function cn(...inputs: (string | undefined | null | false | 0)[]): string {
  return inputs.filter(Boolean).join(" ");
}

// Converts any hashrate string to TH-equivalent.
// Examples: "270 TH/s" → 270  |  "17 GH/s" → 0.017  |  "420 kSol/s" → 4.2e-7
// TH = base unit. GH = /1e3, MH = /1e6, kH/kSol = /1e9
export function parseHashrateTH(s: string): number {
  const m = s.match(/([\d.,]+)\s*([TGMK])/i);
  if (m) {
    const val = parseFloat(m[1].replace(",", "."));
    const u = m[2].toUpperCase();
    if (u === "K") return val / 1e9;
    if (u === "G") return val / 1e3;
    if (u === "M") return val / 1e6;
    return val; // T
  }
  // No unit prefix → assume TH/s
  const num = s.match(/([\d.,]+)/);
  return num ? parseFloat(num[1].replace(",", ".")) : 0;
}
