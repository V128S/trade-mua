import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale, getTranslations } from "next-intl/server";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Syne, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import { routing } from "@/i18n/routing";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CryptoPriceTicker from "@/components/layout/CryptoPriceTicker";
import NavigationProgress from "@/components/ui/NavigationProgress";
import BackgroundSparkles from "@/components/ui/background-sparkles";
import ScrollToTop from "@/components/ui/ScrollToTop";
import JsonLd from "@/components/seo/JsonLd";
import "../globals.css";

const SITE_URL = "https://trade-mua.vercel.app";

const syne = Syne({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-syne", display: "swap" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-hanken", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["500"], variable: "--font-jetbrains", display: "swap" });

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
    <html lang={locale} className={`dark ${syne.variable} ${hanken.variable} ${jetbrains.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.classList.remove('dark','light');document.documentElement.classList.add(t);}}catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="bg-[#111110] text-on-surface selection:bg-primary selection:text-on-primary">
        <JsonLd data={[orgLd, websiteLd]} />
        <NextIntlClientProvider messages={messages}>
          <NavigationProgress />
          <BackgroundSparkles />
          <Navbar />
          <main className="pt-20">
            <CryptoPriceTicker />
            {children}
          </main>
          <Footer />
          <ScrollToTop />
        </NextIntlClientProvider>
      </body>
      {process.env.NODE_ENV === "production" && <GoogleAnalytics gaId="G-PFXVHGW9JT" />}
    </html>
  );
}
