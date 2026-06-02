import { routing } from "@/i18n/routing";

const NON_DEFAULT = routing.locales.filter((l) => l !== routing.defaultLocale);

/** Remove a leading non-default locale prefix (e.g. /en/admin -> /admin). */
export function stripLocale(pathname: string): string {
  for (const loc of NON_DEFAULT) {
    if (pathname === `/${loc}`) return "/";
    if (pathname.startsWith(`/${loc}/`)) return pathname.slice(loc.length + 1);
  }
  return pathname;
}

const PROTECTED = ["/dashboard", "/admin", "/checkout"];

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
