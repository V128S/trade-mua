import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Calculator from "@/components/calculator/Calculator";
import { getMinerstatRevenue, ALGO_NAMES } from "@/lib/minerstat";
import { getUsdUahRate } from "@/lib/fx";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("calculatorTitle"),
    description: t("calculatorDescription"),
    alternates: { languages: { uk: "/calculator", en: "/en/calculator", ru: "/ru/calculator", "x-default": "/calculator" } },
  };
}

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    hashrate?: string;
    power?: string;
    price?: string;
    algorithm?: string;
  }>;
};

export default async function CalculatorPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("calculator");

  const [revenueMap, usdUah, sp] = await Promise.all([getMinerstatRevenue(), getUsdUahRate(), searchParams]);

  const requestedAlgo = sp.algorithm ?? "SHA256";
  const algo = Object.keys(ALGO_NAMES).includes(requestedAlgo) ? requestedAlgo : "SHA256";
  const algoData = revenueMap[algo] ?? revenueMap["SHA256"];

  return (
    <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-16 pb-section-gap">

      <div className="head-rule mb-8">
        <div className="line" />
        <h1 className="font-headline-md text-headline-md gold-text uppercase tracking-widest text-center min-w-0">
          {t("pageHeading")}
        </h1>
        <div className="line" />
      </div>

      {/* Algorithm selector */}
      <div className="flex flex-wrap gap-2 mb-10 justify-center">
        {Object.keys(ALGO_NAMES).map((a) => {
          const data = revenueMap[a];
          if (!data) return null;
          const isActive = a === algo;
          const qs = new URLSearchParams({
            algorithm: a,
            ...(sp.hashrate ? { hashrate: sp.hashrate } : {}),
            ...(sp.power   ? { power:   sp.power   } : {}),
            ...(sp.price   ? { price:   sp.price   } : {}),
          }).toString();
          return (
            <a
              key={a}
              href={`/calculator?${qs}`}
              className={`px-4 py-2 rounded font-label-caps text-label-caps uppercase tracking-widest text-[11px] transition-colors ${
                isActive ? "bg-primary text-on-primary" : "chip hover:border-primary/50"
              }`}
            >
              {a} · {data.coin}
            </a>
          );
        })}
      </div>

      <Calculator
        coinPrice={algoData?.coinPrice ?? 0}
        coinSymbol={algoData?.coin ?? "BTC"}
        revenuePerTH={algoData?.revenuePerTH ?? 0}
        revenue24h={algoData?.revenue24h}
        usdUah={usdUah}
        initialHashrate={sp.hashrate ?? ""}
        initialPower={sp.power ? Number(sp.power) : 3500}
        initialPrice={sp.price ? Number(sp.price) : 0}
      />
    </div>
  );
}
