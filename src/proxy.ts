import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { stripLocale, isProtectedPath } from "@/lib/auth-routing";

const intlMiddleware = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  // 1) Locale routing first (may rewrite/redirect for prefixes)
  const intlResponse = intlMiddleware(request);

  // 2) Auth gate on the locale-stripped path
  const strippedPath = stripLocale(request.nextUrl.pathname);
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
      loginUrl.pathname = request.nextUrl.pathname.startsWith("/en")
        ? "/en/login"
        : "/login";
      loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return intlResponse;
}

export const config = {
  matcher: ["/((?!api|(?:en/)?auth/callback|_next|_vercel|.*\\..*).*)"],
};
