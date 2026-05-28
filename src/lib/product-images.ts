// Maps product model names to local product images in /public/products/
export function getProductImage(name: string): string | null {
  // S21 series — hydro/water cooling
  if (/s21.*xp.*hyd|s21.*\+.*hyd|s21e.*hyd|s21.*hydro|s21.*hud/i.test(name))
    return "/products/antminer-s21-hydro.png";
  // S21 series — air / immersion
  if (/s21/i.test(name))
    return "/products/antminer-s21-air.png";
  // S23 series — hydro
  if (/s23.*hyd|s23.*hud/i.test(name))
    return "/products/antminer-s23-hydro.png";
  // S23 series — air / immersion
  if (/s23/i.test(name))
    return "/products/antminer-s23-air.png";
  // S19 series
  if (/s19/i.test(name))
    return "/products/antminer-s19-xp.png";
  // L series Scrypt miners (L7, L9, L11)
  if (/antminer\s+l\d/i.test(name))
    return "/products/antminer-l9.png";
  // T21 — same body as S21 air
  if (/t21/i.test(name))
    return "/products/antminer-s21-air.png";
  return null;
}
