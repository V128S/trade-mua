import type { Metadata } from "next";
import Calculator from "@/components/calculator/Calculator";

export const revalidate = 300; // refresh every 5 min

export const metadata: Metadata = {
  title: "Калькулятор прибутковості | Trade M",
  description: "Розрахуйте прибутковість ASIC-майнера з урахуванням поточного курсу BTC та складності мережі.",
};

async function getBTCData(): Promise<{ btcPrice: number; revenuePerTH: number }> {
  try {
    const [priceRes, diffRes] = await Promise.all([
      fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
        { next: { revalidate: 300 } }
      ),
      fetch("https://blockchain.info/q/getdifficulty", {
        next: { revalidate: 300 },
      }),
    ]);
    if (!priceRes.ok || !diffRes.ok) throw new Error("fetch failed");
    const priceData = await priceRes.json();
    const btcPrice: number = priceData?.bitcoin?.usd ?? 0;
    const difficulty = parseFloat(await diffRes.text());
    if (!btcPrice || !difficulty) throw new Error("bad data");
    // BTC per TH/s per day = 144 blocks/day * 3.125 BTC/block / networkHashTH
    const networkHashTH = (difficulty * 4_294_967_296) / 600 / 1e12;
    const revenuePerTH = (144 * 3.125 * btcPrice) / networkHashTH;
    return { btcPrice, revenuePerTH };
  } catch {
    return { btcPrice: 0, revenuePerTH: 0 };
  }
}

type Props = { searchParams: Promise<{ hashrate?: string; power?: string }> };

export default async function CalculatorPage({ searchParams }: Props) {
  const [btcData, params] = await Promise.all([getBTCData(), searchParams]);

  return (
    <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-16 pb-section-gap">

      {/* Header */}
      <div className="flex items-center gap-4 mb-12">
        <div className="h-px bg-outline-variant flex-1" />
        <h1 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest whitespace-nowrap">
          Калькулятор Прибутковості
        </h1>
        <div className="h-px bg-outline-variant flex-1" />
      </div>

      <Calculator
        btcPrice={btcData.btcPrice}
        revenuePerTH={btcData.revenuePerTH}
        initialHashrate={params.hashrate ?? ""}
        initialPower={params.power ? Number(params.power) : 3500}
      />
    </div>
  );
}
