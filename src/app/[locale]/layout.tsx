import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale, getTranslations } from "next-intl/server";
import Script from "next/script";
import { Unbounded, Manrope, JetBrains_Mono } from "next/font/google";
import { routing } from "@/i18n/routing";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CryptoPriceTicker from "@/components/layout/CryptoPriceTicker";
import NavigationProgress from "@/components/ui/NavigationProgress";
import GlassBackground from "@/components/ui/GlassBackground";
import ScrollToTop from "@/components/ui/ScrollToTop";
import FloatingContact from "@/components/ui/FloatingContact";
import JsonLd from "@/components/seo/JsonLd";
import "../globals.css";

const SITE_URL = "https://trade-mua.vercel.app";

// Material Symbols Outlined is self-hosted (subset of the 56 icons used) via an
// @font-face + .material-symbols-outlined class in globals.css — no Google
// Fonts request chain. When adding a new icon, re-subset the woff2 at
// public/fonts/material-symbols.woff2 (Google css2 ?icon_names=… → download).

const display = Unbounded({ subsets: ["latin", "cyrillic"], weight: ["600", "700", "800"], variable: "--font-display", display: "swap" });
const body = Manrope({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700", "800"], variable: "--font-body", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "700"], variable: "--font-mono", display: "swap" });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    // Makes every page's relative `alternates.languages` (hreflang) resolve to
    // absolute URLs — fixes the PageSpeed SEO "Document doesn't have a valid
    // hreflang" flag (Google requires absolute hreflang hrefs).
    metadataBase: new URL(SITE_URL),
    title: t("homeTitle"),
    description: t("homeDescription"),
    verification: { google: "GUtZWvOqzDL18Dibg_f1RtVsE8o2kaNPEZErzjycOsc" },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  // Only ship namespaces that CLIENT components actually use to the browser —
  // server components translate on the server and don't need messages hydrated.
  // (Halves the i18n payload in every page's RSC stream. Audited: every
  // "use client" component's useTranslations namespace is listed here.)
  const CLIENT_NAMESPACES = [
    "auth", "calculator", "cart", "checkout", "common", "home", "nav", "products",
  ];
  const clientMessages = Object.fromEntries(
    Object.entries(messages).filter(([ns]) => CLIENT_NAMESPACES.includes(ns))
  );

  // Site-wide structured data (built from our own constants, not user input)
  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Trade M",
    url: SITE_URL,
    logo: `${SITE_URL}/icon.png`,
  };
  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Trade M",
    url: SITE_URL,
    inLanguage: locale === "ru" ? "ru-RU" : "uk-UA",
  };

  return (
    <html lang={locale} className={`dark ${display.variable} ${body.variable} ${mono.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.classList.remove('dark','light');document.documentElement.classList.add(t);}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="bg-[#0b0b08] text-on-surface selection:bg-primary selection:text-on-primary">
        <JsonLd data={[orgLd, websiteLd]} />
        <NextIntlClientProvider messages={clientMessages}>
          <NavigationProgress />
          <GlassBackground />
          {/* Ticker pinned at the very top, navbar fixed directly below it (top-9) */}
          <CryptoPriceTicker />
          <Navbar />
          <main className="pt-[108px]">
            {children}
          </main>
          <Footer />
          <ScrollToTop />
          <FloatingContact />
        </NextIntlClientProvider>
        {/* GA deferred to idle (lazyOnload) so the ~155 KB GTM payload stays off
            the load/TBT critical path. */}
        {process.env.NODE_ENV === "production" && (
          <>
            <Script
              src="https://www.googletagmanager.com/gtag/js?id=G-PFXVHGW9JT"
              strategy="lazyOnload"
            />
            <Script id="ga-init" strategy="lazyOnload">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-PFXVHGW9JT');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
