const P = "/products/new";

// Resolves a product photo. Priority:
//   1. `imageUrl` — explicit URL synced from the Google Sheet (manager self-service)
//   2. name→bundled-file mapping below (hardcoded, shipped in /public)
//   3. null → caller shows a placeholder icon
export function getProductImage(name: string, imageUrl?: string | null): string | null {
  if (imageUrl && /^https?:\/\//i.test(imageUrl)) return imageUrl;

  const n = name.toLowerCase();

  // ── AntMiner / Bitmain S19 ──────────────────────────────────────────────
  if (/s19k/i.test(n))
    return `${P}/bitmain-s19k-pro.webp`;
  if (/s19.*pro.*hyd/i.test(n))
    return `${P}/bitmain-s19-pro-plus-hyd.webp`;
  if (/s19.*xp.*3u/i.test(n))
    return `${P}/bitmain-s19-xp-hyd-3u.webp`;
  if (/s19.*xp.*\+.*hyd|s19.*xp\+.*hyd/i.test(n))
    return `${P}/bitmain-s19-xp-plus-hyd.webp`;
  if (/s19.*xp.*hyd/i.test(n))
    return `${P}/bitmain-s19-xp-hyd.webp`;
  if (/s19.*xp/i.test(n))
    return `${P}/bitmain-s19-xp.webp`;
  if (/s19/i.test(n))
    return `${P}/bitmain-s19-xp.webp`;

  // ── AntMiner / Bitmain S21 ──────────────────────────────────────────────
  if (/s21e.*xp.*hyd|s21e.*xp/i.test(n))
    return `${P}/bitmain-s21e-xp-hyd-3u.webp`;
  if (/s21e.*hyd/i.test(n))
    return `${P}/bitmain-s21e-hyd.webp`;
  if (/s21.*xp.*hyd/i.test(n))
    return `${P}/bitmain-s21-xp-hyd.webp`;
  if (/s21.*xp.*imm/i.test(n))
    return `${P}/bitmain-s21-xp-imm.webp`;
  if (/s21.*xp/i.test(n))
    return `${P}/bitmain-s21-xp.webp`;
  if (/s21.*pro\+|s21.*pro.*\+/i.test(n))
    return `${P}/bitmain-s21-pro-plus.webp`;
  if (/s21.*pro/i.test(n))
    return `${P}/bitmain-s21-pro.webp`;
  if (/s21.*\+.*hyd|s21\+.*hyd/i.test(n))
    return `${P}/bitmain-s21-plus-hyd.webp`;
  if (/s21\+|s21.*plus/i.test(n))
    return `${P}/bitmain-s21-plus.webp`;
  if (/s21.*imm/i.test(n))
    return `${P}/bitmain-s21-imm.webp`;
  if (/s21/i.test(n))
    return `${P}/bitmain-s21.webp`;

  // ── AntMiner / Bitmain S23 ──────────────────────────────────────────────
  if (/s23.*hyd.*3u/i.test(n))
    return `${P}/bitmain-s23-hyd-3u.webp`;
  if (/s23.*hyd/i.test(n))
    return `${P}/bitmain-s23-hyd.webp`;
  if (/s23.*imm/i.test(n))
    return `${P}/bitmain-s23-imm.webp`;
  if (/s23/i.test(n))
    return `${P}/bitmain-s23.webp`;

  // ── AntMiner L series ───────────────────────────────────────────────────
  if (/l11.*hyd.*6u/i.test(n))
    return `${P}/bitmain-l11-hyd-6u.webp`;
  if (/l11.*hyd/i.test(n))
    return `${P}/bitmain-l11-hyd-2u.webp`;
  if (/l11/i.test(n))
    return `${P}/bitmain-l11.webp`;
  if (/l9.*hyd/i.test(n))
    return `${P}/bitmain-l9-hyd-2u.webp`;
  if (/l9/i.test(n))
    return `${P}/bitmain-l9.webp`;
  if (/l7/i.test(n))
    return `${P}/bitmain-l7.webp`;

  // ── AntMiner T21 ────────────────────────────────────────────────────────
  if (/t21/i.test(n))
    return `${P}/bitmain-t21.webp`;

  // ── AntMiner KS7 ────────────────────────────────────────────────────────
  if (/ks7/i.test(n))
    return `${P}/bitmain-ks7.webp`;

  // ── AntMiner D9 ─────────────────────────────────────────────────────────
  if (/\bd9\b/i.test(n))
    return `${P}/bitmain-d9.webp`;

  // ── AntMiner E9 / E11 ───────────────────────────────────────────────────
  if (/\be9/i.test(n))
    return `${P}/bitmain-e9-pro.webp`;
  if (/\be11/i.test(n))
    return `${P}/bitmain-e11.webp`;

  // ── AntMiner Z15 ────────────────────────────────────────────────────────
  if (/z15/i.test(n))
    return `${P}/bitmain-z15-pro.webp`;

  // ── AntMiner HS3 ────────────────────────────────────────────────────────
  if (/hs3/i.test(n))
    return `${P}/bitmain-HS3.webp`;

  // ── WhatsMiner ──────────────────────────────────────────────────────────
  if (/m73/i.test(n))
    return `${P}/Whatsminer-M73.webp`;
  if (/m70/i.test(n))
    return `${P}/Whatsminer-M70.webp`;
  if (/m63s.*\+|m63s.*plus/i.test(n))
    return `${P}/Whatsminer-M63S-Plus.webp`;
  if (/m61.*\+|m61.*plus/i.test(n))
    return `${P}/Whatsminer-M61-plus.webp`;
  if (/m61/i.test(n))
    return `${P}/Whatsminer-M61.webp`;
  if (/m60/i.test(n))
    return `${P}/Whatsminer-M60.webp`;
  if (/m50s/i.test(n))
    return `${P}/Whatsminer-M50S.webp`;
  if (/whatsminer|m5[0-9]|m6[0-9]|m7[0-9]/i.test(n))
    return `${P}/Whatsminer-M60.webp`;

  // ── Avalon ──────────────────────────────────────────────────────────────
  if (/avalon.*q\b/i.test(n))
    return `${P}/avalon-q.webp`;
  if (/avalon.*mini.*3|mini.*3/i.test(n))
    return `${P}/Avalon-Mini3.webp`;
  if (/avalon.*nano.*3s|nano.*3s/i.test(n))
    return `${P}/Avalon-Nano3s.webp`;
  if (/avalon.*a15|a15.*xp/i.test(n))
    return `${P}/Avalon-a15-xp.webp`;

  // ── ElphaPex ────────────────────────────────────────────────────────────
  if (/dg.*hyd|elpha.*hyd/i.test(n))
    return `${P}/ElphaPex-DG-Hyd-1.webp`;
  if (/dg.*home|elpha.*home/i.test(n))
    return `${P}/ElphaPex-DG-Home-1.webp`;

  // ── FluMiner ────────────────────────────────────────────────────────────
  if (/flu.*t3/i.test(n))
    return `${P}/Fluminer-T3.webp`;
  if (/flu.*l1\b/i.test(n))
    return `${P}/Fluminer-L1.webp`;
  if (/flu.*l2\b/i.test(n))
    return `${P}/Fluminer-L2.webp`;
  if (/flu.*l3\b/i.test(n))
    return `${P}/Fluminer-L3.webp`;
  if (/fluminer/i.test(n))
    return `${P}/Fluminer-L1.webp`;

  // ── Pinecone ────────────────────────────────────────────────────────────
  if (/inibox.*pro|pinecone.*pro/i.test(n))
    return `${P}/Pinecone-Inibox-pro.webp`;
  if (/inibox|pinecone/i.test(n))
    return `${P}/Pinecone-Inibox.webp`;

  // ── VolcMiner ───────────────────────────────────────────────────────────
  if (/volcminer|d1.*mini/i.test(n))
    return `${P}/VolcMiner-D1-Mini.webp`;

  // ── Jasminer ────────────────────────────────────────────────────────────
  if (/x16.*q.*pro|jasminer.*q.*pro/i.test(n))
    return `${P}/Jasminer-X16-Q-Pro.webp`;
  if (/x16.*qe|jasminer.*qe/i.test(n))
    return `${P}/Jasminer-X16-QE.webp`;
  if (/x16.*q\b|jasminer.*q\b/i.test(n))
    return `${P}/Jasminer-X16-Q.webp`;
  if (/x16.*p\b|jasminer.*x16.*p/i.test(n))
    return `${P}/Jasminer-X16-P.webp`;
  if (/jasminer/i.test(n))
    return `${P}/Jasminer-X16-Q.webp`;

  // ── Bombax ──────────────────────────────────────────────────────────────
  if (/ez100.*pro/i.test(n))
    return `${P}/Bombax-ez100-pro.webp`;
  if (/ez100.*c\b/i.test(n))
    return `${P}/Bombax-ez100-c.webp`;
  if (/ez100|bombax/i.test(n))
    return `${P}/Bombax-ez100.webp`;

  return null;
}
