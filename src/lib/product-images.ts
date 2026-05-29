const NEW = "/products/new";

export function getProductImage(name: string): string | null {
  const n = name.toLowerCase();

  // ── AntMiner S21 family ─────────────────────────────────────────────────
  // S21 XP + Hydro (S21 XP Hyd, S21 XP Hydro, S21E XP Hyd, S21e Hyd)
  if (/s21.*xp.*hyd|s21e.*hyd/i.test(n))
    return `${NEW}/bitmain-s21-xp-hyd.webp`;
  // S21 XP air/IMM (S21XP, S21XP IMM, S21 XP without hyd)
  if (/s21.*xp/i.test(n))
    return `${NEW}/bitmain-s21-xp.webp`;
  // S21+ Hydro
  if (/s21\+.*hyd/i.test(n))
    return `${NEW}/bitmain-s21-plus-hyd.webp`;
  // S21+ air / S21 Pro / S21 Pro+
  if (/s21\+|s21.*pro/i.test(n))
    return `${NEW}/bitmain-s21-plus.webp`;
  // S21 base / S21 IMM (catch-all after specific patterns)
  if (/s21/i.test(n))
    return `${NEW}/bitmain-s21-plus.webp`;

  // ── AntMiner S23 family ─────────────────────────────────────────────────
  if (/s23.*hyd/i.test(n))
    return `${NEW}/bitmain-s21-xp-hyd.webp`;
  if (/s23/i.test(n))
    return `${NEW}/bitmain-s21-plus.webp`;

  // ── AntMiner S19 family ─────────────────────────────────────────────────
  if (/s19/i.test(n))
    return "/products/antminer-s19-xp.png";

  // ── AntMiner L series ───────────────────────────────────────────────────
  if (/l11.*hyd/i.test(n))
    return `${NEW}/bitmain-l11-hyd-2u.webp`;
  if (/l11/i.test(n))
    return `${NEW}/bitmain-l11.webp`;
  if (/l9.*hyd/i.test(n))
    return `${NEW}/bitmain-l9-hyd-2u.webp`;
  if (/l9/i.test(n))
    return `${NEW}/bitmain-l9.webp`;
  if (/l7/i.test(n))
    return `${NEW}/bitmain-l7.webp`;

  // ── AntMiner T21 ────────────────────────────────────────────────────────
  if (/t21/i.test(n))
    return `${NEW}/bitmain-s21-plus.webp`;

  // ── AntMiner KS7 ────────────────────────────────────────────────────────
  if (/ks7/i.test(n))
    return `${NEW}/bitmain-ks7.webp`;

  // ── Avalon ──────────────────────────────────────────────────────────────
  if (/avalon.*q\b/i.test(n))
    return `${NEW}/avalon-q.webp`;

  // ── ElphaPex ────────────────────────────────────────────────────────────
  if (/dg.*hyd|elpha.*hyd/i.test(n))
    return `${NEW}/ElphaPex-DG-Hyd-1.webp`;
  if (/dg.*home|elpha.*home/i.test(n))
    return `${NEW}/ElphaPex-DG-Home-1.webp`;

  // ── FluMiner ────────────────────────────────────────────────────────────
  if (/flu.*l1\b/i.test(n))
    return `${NEW}/Fluminer-L1.webp`;
  if (/flu.*l2\b/i.test(n))
    return `${NEW}/Fluminer-L2.webp`;
  if (/flu.*(l3|t3)/i.test(n))
    return `${NEW}/Fluminer-L3.webp`;

  // ── VolcMiner ───────────────────────────────────────────────────────────
  if (/volcminer|d1.*mini/i.test(n))
    return `${NEW}/VolcMiner-D1-Mini.webp`;

  return null;
}
