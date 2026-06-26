import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { stripLocale, isProtectedPath } from "@/lib/auth-routing";

const intlMiddleware = createMiddleware(routing);

// Rate limiting: max requests per 1-minute window per IP, keyed by path group.
const RATE_RULES: { group: string; limit: number; test: (p: string) => boolean }[] = [
  {
    group: 'auth',
    limit: 10,
    test: (p) => p === '/login' || p === '/register' || p === '/auth/reset-password',
  },
  {
    group: 'checkout',
    limit: 5,
    test: (p) => p === '/checkout',
  },
]

// Calls the rate_limit_check Postgres RPC via the Supabase REST API.
// Fails open (returns true = allowed) on any network or HTTP error so a
// Supabase hiccup never blocks legitimate users.
async function isAllowed(ip: string, group: string, limit: number): Promise<boolean> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/rate_limit_check`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
        body: JSON.stringify({ p_ip: ip, p_path_group: group, p_limit: limit }),
      }
    )
    if (!res.ok) return true
    return (await res.json()) as boolean
  } catch {
    return true
  }
}

export async function proxy(request: NextRequest) {
  // 1) Locale routing first (may rewrite/redirect for prefixes)
  const intlResponse = intlMiddleware(request);

  const strippedPath = stripLocale(request.nextUrl.pathname);

  // 2) Rate limiting on auth and checkout paths.
  // Skip if IP is unavailable (local dev without a proxy in front).
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (ip) {
    for (const rule of RATE_RULES) {
      if (rule.test(strippedPath)) {
        const allowed = await isAllowed(ip, rule.group, rule.limit)
        if (!allowed) {
          return new NextResponse('Too Many Requests', {
            status: 429,
            headers: { 'Retry-After': '60' },
          })
        }
        break
      }
    }
  }

  // 3) Auth gate on the locale-stripped path
  if (isProtectedPath(strippedPath)) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            // Persist any refreshed Supabase auth cookies onto the response
            // next-intl produced, otherwise token refresh is silently dropped
            // and the user gets logged out on protected routes.
            cookiesToSet.forEach(({ name, value, options }) =>
              intlResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      // Preserve the current non-default locale prefix on the login redirect
      // (e.g. /ru/dashboard -> /ru/login, /en/... -> /en/login, default -> /login).
      const localePrefix = routing.locales
        .filter((l) => l !== routing.defaultLocale)
        .find((l) => request.nextUrl.pathname === `/${l}` || request.nextUrl.pathname.startsWith(`/${l}/`));
      loginUrl.pathname = localePrefix ? `/${localePrefix}/login` : "/login";
      loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return intlResponse;
}

export const config = {
  matcher: ["/((?!api|(?:en/)?auth/callback|_next|_vercel|.*\\..*).*)"],
};
