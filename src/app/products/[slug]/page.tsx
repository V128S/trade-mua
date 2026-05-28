import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProducts } from "@/lib/sheets";

export const revalidate = 3600;

// Parse hashrate string to TH/s float (e.g. "335 TH/s" → 335, "20 GH/s" → 0.02)
function toTHs(hashrate: string): number {
  const m = hashrate.match(/([\d.,]+)\s*(TH|GH|MH|T|G|M)/i);
  if (!m) return 0;
  const val = parseFloat(m[1].replace(",", "."));
  const unit = m[2].toUpperCase();
  if (unit.startsWith("G")) return val / 1000;
  if (unit.startsWith("M")) return val / 1_000_000;
  return val;
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const products = await getProducts();
  const product = products.find((p) => p.id === slug);
  if (!product) return { title: "Trade M" };
  return {
    title: `${product.name} | Trade M`,
    description: `${product.name} — ${product.hashrate}, ${product.powerW}W. Купити ASIC-майнер в Trade M.`,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const products = await getProducts();
  const product = products.find((p) => p.id === slug);

  if (!product) notFound();

  const thValue = toTHs(product.hashrate);
  const efficiencyJTH = thValue > 0 ? (product.powerW / thValue).toFixed(1) : "—";
  const powerKW = product.powerW / 1000;

  // Recommended electricity: 0.07 $/kWh (mining hotel rate)
  const electricityCost = 0.07;
  const dailyElecCost = powerKW * 24 * electricityCost;

  return (
    <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-12 pb-section-gap">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest mb-10">
        <Link href="/" className="hover:text-primary transition-colors">Головна</Link>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <Link href="/products" className="hover:text-primary transition-colors">Каталог</Link>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-on-surface truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-16">

        {/* Left — image placeholder */}
        <div className="bg-card border-card rounded-lg h-80 lg:h-[500px] relative flex items-center justify-center overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2/3 h-2/3 bg-primary/5 blur-[80px] rounded-full" />
          <span className="material-symbols-outlined text-outline-variant text-[96px] relative z-10">memory</span>
          <div className="absolute top-4 left-4 flex gap-2 z-20">
            {product.isNew && (
              <span className="chip px-2 py-1 font-technical-data text-[10px] uppercase tracking-wider">Новинка</span>
            )}
            <span className={`chip px-2 py-1 font-technical-data text-[10px] uppercase tracking-wider ${product.inStock ? "bg-[#1a2b1a] text-green-400" : ""}`}>
              {product.inStock ? "В наявності" : "Під замовлення"}
            </span>
          </div>
        </div>

        {/* Right — info */}
        <div className="flex flex-col gap-6">

          {/* Algorithm label */}
          <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest">
            {product.algorithm}
          </span>

          {/* Name */}
          <h1 className="font-headline-lg text-headline-lg text-on-surface uppercase tracking-wide leading-tight">
            {product.name}
          </h1>

          {/* Specs grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Хешрейт", value: product.hashrate || "—" },
              { label: "Споживання", value: `${product.powerW} W` },
              { label: "Ефективність", value: `${efficiencyJTH} J/TH` },
            ].map((s) => (
              <div key={s.label} className="bg-card border-card rounded-lg p-4 flex flex-col gap-1">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">
                  {s.label}
                </span>
                <span className="font-technical-data text-technical-data text-primary text-base">
                  {s.value}
                </span>
              </div>
            ))}
          </div>

          {/* Electricity estimate */}
          <div className="bg-card border-card rounded-lg p-4">
            <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px] mb-2">
              Витрати на електроенергію
            </p>
            <div className="flex gap-6">
              <div>
                <p className="font-technical-data text-technical-data text-primary">
                  ${dailyElecCost.toFixed(2)} / день
                </p>
                <p className="font-label-caps text-label-caps text-on-surface-variant text-[10px]">
                  при $0.07/кВт·год
                </p>
              </div>
              <div>
                <p className="font-technical-data text-technical-data text-primary">
                  ${(dailyElecCost * 30).toFixed(0)} / місяць
                </p>
                <p className="font-label-caps text-label-caps text-on-surface-variant text-[10px]">
                  30 діб
                </p>
              </div>
            </div>
          </div>

          {/* Price + CTAs */}
          <div className="border-t border-[#2e2d2b] pt-6 space-y-4">
            <div>
              <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px] mb-1">
                {product.inStock ? "Ціна (в наявності)" : "Ціна (під замовлення)"}
              </p>
              <p className="font-display-lg text-[40px] leading-none text-primary">
                ${product.priceUSDT.toLocaleString()}
              </p>
              <p className="font-label-caps text-label-caps text-on-surface-variant text-[10px] mt-1">
                Оплата USDT / Готівка / Переказ
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/contact">
                <button className="btn-primary py-4 px-8 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-transform">
                  <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                  {product.inStock ? "Купити" : "Замовити"}
                </button>
              </Link>
              <Link href="/contact">
                <button className="btn-ghost py-4 px-8 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">contact_support</span>
                  Консультація
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Calculator CTA */}
      <div className="mt-16 bg-card border-card rounded-lg p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest mb-1">
            Розрахувати прибутковість
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Введіть тариф електроенергії та подивіться реальний ROI для цього майнера.
          </p>
        </div>
        <Link href={`/calculator?hashrate=${encodeURIComponent(product.hashrate)}&power=${product.powerW}`} className="shrink-0">
          <button className="btn-ghost py-3 px-6 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">calculate</span>
            Калькулятор
          </button>
        </Link>
      </div>

      {/* Back link */}
      <div className="mt-10">
        <Link
          href="/products"
          className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Весь каталог
        </Link>
      </div>
    </div>
  );
}
