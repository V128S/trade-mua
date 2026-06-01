import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale, getTranslations } from "next-intl/server";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Unbounded, Manrope, JetBrains_Mono } from "next/font/google";
import { routing } from "@/i18n/routing";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CryptoPriceTicker from "@/components/layout/CryptoPriceTicker";
import NavigationProgress from "@/components/ui/NavigationProgress";
import BackgroundSparkles from "@/components/ui/background-sparkles";
import ScrollToTop from "@/components/ui/ScrollToTop";
import FloatingContact from "@/components/ui/FloatingContact";
import JsonLd from "@/components/seo/JsonLd";
import "../globals.css";

const SITE_URL = "https://trade-mua.vercel.app";

// Material Symbols — subset to ONLY the icons actually used on the site (56),
// so the font payload shrinks from the full variable set (~MBs) to a few KB.
// `icon_names` must be alphabetically sorted for the Google Fonts API.
// NOTE: any new <span class="material-symbols-outlined">NAME</span> — including
// dynamic ones from `icon:` props AND bare string arrays (e.g. VALUE_ICONS) —
// MUST be added here, or it renders as raw ligature text in production.
const MATERIAL_SYMBOLS_ICONS = [
  "account_circle", "admin_panel_settings", "arrow_forward", "bolt", "build",
  "calculate", "call", "campaign", "chat", "check", "check_circle",
  "chevron_right", "close", "contact_support", "currency_bitcoin", "dark_mode",
  "delete", "description", "expand_more", "forum", "grid_view", "group",
  "inventory_2", "keyboard_arrow_up", "light_mode", "local_offer",
  "local_shipping", "location_on", "lock", "login", "logout", "manage_accounts",
  "mark_email_read", "memory", "menu", "payments", "person", "phone",
  "receipt_long", "schedule", "search", "search_off", "send", "settings",
  "shield", "shopping_cart", "space_dashboard", "speed", "star",
  "support_agent", "sync", "translate", "trending_up", "tune", "verified",
  "warehouse",
].join(",");

const MATERIAL_SYMBOLS_HREF =
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" +
  `&icon_names=${MATERIAL_SYMBOLS_ICONS}&display=swap`;

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Material Symbols icon font — loaded NON-render-blocking. The stylesheet is
            injected at runtime instead of a plain <link rel="stylesheet">, so it never
            gates first paint (was the #1 PageSpeed issue: ~20.8s render-block on mobile).
            Subsetted via icon_names + display=swap, so the brief pre-load window is tiny. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var l=document.createElement('link');l.rel='stylesheet';l.href=${JSON.stringify(
              MATERIAL_SYMBOLS_HREF
            )};document.head.appendChild(l);})();`,
          }}
        />
        <noscript>
          <link rel="stylesheet" href={MATERIAL_SYMBOLS_HREF} />
        </noscript>
      </head>
      <body className="bg-[#0b0b08] text-on-surface selection:bg-primary selection:text-on-primary">
        <JsonLd data={[orgLd, websiteLd]} />
        <NextIntlClientProvider messages={clientMessages}>
          <NavigationProgress />
          <BackgroundSparkles />
          <Navbar />
          <main className="pt-20">
            <CryptoPriceTicker />
            {children}
          </main>
          <Footer />
          <ScrollToTop />
          <FloatingContact />
        </NextIntlClientProvider>
      </body>
      {process.env.NODE_ENV === "production" && <GoogleAnalytics gaId="G-PFXVHGW9JT" />}
    </html>
  );
}
