import type { Metadata } from "next";
import Calculator from "@/components/calculator/Calculator";
import { getMinerstatRevenue, ALGO_NAMES } from "@/lib/minerstat";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Калькулятор прибутковості | Trade M",
  description: "Розрахуйте прибутковість ASIC-майнера з урахуванням поточного курсу та складності мережі.",
};

type Props = {
  searchParams: Promise<{
    hashrate?: string;
    power?: string;
    price?: string;
    algorithm?: string;
  }>;
};

export default async function CalculatorPage({ searchParams }: Props) {
  const [revenueMap, params] = await Promise.all([getMinerstatRevenue(), searchParams]);

  const requestedAlgo = params.algorithm ?? "SHA256";
  const algo = Object.keys(ALGO_NAMES).includes(requestedAlgo) ? requestedAlgo : "SHA256";
  const algoData = revenueMap[algo] ?? revenueMap["SHA256"];

  return (
    <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-16 pb-section-gap">

      <div className="flex items-center gap-4 mb-8">
        <div className="h-px bg-outline-variant flex-1" />
        <h1 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest whitespace-nowrap">
          Калькулятор Прибутковості
        </h1>
        <div className="h-px bg-outline-variant flex-1" />
      </div>

      {/* Algorithm selector */}
      <div className="flex flex-wrap gap-2 mb-10 justify-center">
        {Object.keys(ALGO_NAMES).map((a) => {
          const data = revenueMap[a];
          if (!data) return null;
          const isActive = a === algo;
          const qs = new URLSearchParams({
            algorithm: a,
            ...(params.hashrate ? { hashrate: params.hashrate } : {}),
            ...(params.power   ? { power:   params.power   } : {}),
            ...(params.price   ? { price:   params.price   } : {}),
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
        initialHashrate={params.hashrate ?? ""}
        initialPower={params.power ? Number(params.power) : 3500}
        initialPrice={params.price ? Number(params.price) : 0}
      />
    </div>
  );
}
