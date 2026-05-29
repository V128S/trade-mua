import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductsFromDB } from "@/lib/products";
import ProductDetail from "@/components/products/ProductDetail";
import { getProductImage } from "@/lib/product-images";
import { getMinerstatRevenue } from "@/lib/minerstat";

export const revalidate = 60;

// Strip hashrate suffix to get base model name
// "Antminer S21 Hydro 335Th" → "Antminer S21 Hydro"
function getBaseName(name: string): string {
  return name.replace(/\s*\d[\d.,]*\s*(?:TH\/s|GH\/s|MH\/s|Th|Gh|Mh|T|G|M)\s*$/i, "").trim();
}

function getCooling(name: string): string {
  if (/hyd/i.test(name)) return "Hydro";
  if (/imm/i.test(name)) return "Immersion";
  return "Air";
}


type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const products = await getProductsFromDB();
  const product = products.find((p) => p.id === slug);
  if (!product) return { title: "Trade M" };
  return {
    title: `${product.name} | Trade M`,
    description: `${product.name} — ${product.hashrate}, ${product.powerW}W. Купити ASIC-майнер в Trade M.`,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [products, revenueMap] = await Promise.all([getProductsFromDB(), getMinerstatRevenue()]);

  const product = products.find((p) => p.id === slug);
  if (!product) notFound();

  // Revenue for this product's specific algorithm
  const algoData = revenueMap[product.algorithm] ?? revenueMap["SHA256"];
  const revenuePerTH = algoData?.revenuePerTH ?? 0;

  const baseName = getBaseName(product.name);
  const cooling = getCooling(product.name);

  // All configurations = same base name, sorted by hashrate desc
  const configs = products
    .filter((p) => getBaseName(p.name) === baseName)
    .sort((a, b) => b.priceUSDT - a.priceUSDT);

  // Similar models = same algorithm, different base name, max 4
  const similar = products
    .filter((p) => p.algorithm === product.algorithm && getBaseName(p.name) !== baseName)
    .slice(0, 4);

  const specs = [
    { label: "Алгоритм", value: product.algorithm },
    { label: "Хешрейт", value: product.hashrate || "—" },
    { label: "Енергоспоживання", value: `${product.powerW} W` },
    { label: "Охолодження", value: cooling },
  ];

  return (
    <div className="pb-section-gap">

      {/* ── Hero section ── */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto pt-10 pb-16">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px] mb-10">
          <Link href="/" className="hover:text-primary transition-colors">Головна</Link>
          <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          <Link href="/products" className="hover:text-primary transition-colors">Майнери</Link>
          <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          <span className="text-on-surface truncate max-w-[220px] uppercase">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16 items-start">

          {/* Left — product image */}
          {(() => {
            const imgSrc = getProductImage(product.name);
            return (
              <div className="relative bg-card border-card rounded-lg overflow-hidden aspect-square flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2/3 h-2/3 bg-primary/6 blur-[100px] rounded-full" />
                <div className="absolute inset-0 opacity-[0.02]"
                  style={{ backgroundImage: "radial-gradient(#ecc246 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
                {imgSrc ? (
                  <Image
                    src={imgSrc}
                    alt={product.name}
                    width={420}
                    height={420}
                    className="relative z-10 object-contain drop-shadow-2xl"
                    priority
                  />
                ) : (
                  <span className="material-symbols-outlined text-outline-variant text-[120px] relative z-10">memory</span>
                )}
                <div className="absolute top-4 left-4 flex gap-2 z-20">
                  {product.isNew && (
                    <span className="chip px-2 py-1 font-technical-data text-[10px] uppercase tracking-wider">Новинка</span>
                  )}
                  <span className={`chip px-2 py-1 font-technical-data text-[10px] uppercase tracking-wider ${product.inStock ? "bg-[#1a2b1a] text-green-400" : ""}`}>
                    {product.inStock ? "In Stock" : "Під замовлення"}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Right — details */}
          <div className="flex flex-col gap-0">
            {/* Algorithm label */}
            <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest text-[11px]">
              {product.algorithm}
            </span>

            {/* Name */}
            <h1 className="font-headline-lg text-headline-lg text-on-surface mt-2 leading-tight">
              {product.name.replace(/\s*\d[\d.,]*\s*(?:TH\/s|GH\/s|MH\/s|Th|Gh|Mh|T|G|M)\s*$/i, "").trim()}
              {product.hashrate && (
                <span className="text-on-surface-variant ml-2 font-normal">{product.hashrate}</span>
              )}
            </h1>

            {/* Description */}
            <p className="font-body-md text-body-md text-on-surface-variant mt-3 max-w-md">
              {cooling === "Hydro"
                ? "Флагманська модель з водяним охолодженням для максимальної стабільності та тихої роботи."
                : cooling === "Immersion"
                ? "Майнер для занурювального охолодження — максимальна ефективність у промислових умовах."
                : "Повітряне охолодження, компактний корпус, оптимальна ефективність для домашнього майнінгу."}
            </p>

            {/* Price */}
            <div className="mt-6">
              <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">
                {product.inStock ? "Ціна (в наявності)" : "Ціна (під замовлення)"}
              </p>
              <p className="font-display-lg text-[52px] leading-none text-primary">
                ${product.priceUSDT.toLocaleString()}
              </p>
              <p className="font-label-caps text-[10px] text-on-surface-variant mt-1">USDT / USD / Готівка</p>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap gap-3 mt-6">
              <Link href="/contact" className="btn-primary py-4 px-8 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-transform">
                <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                {product.inStock ? "Додати в кошик" : "Замовити"}
              </Link>
              <Link href="/contact" className="btn-ghost py-4 px-8 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">contact_support</span>
                Консультація
              </Link>
            </div>

            {/* Config selector + mini calculator (client) */}
            <ProductDetail
              product={product}
              configs={configs.map((c) => ({
                id: c.id,
                hashrate: c.hashrate,
                powerW: c.powerW,
                priceUSDT: c.priceUSDT,
                inStock: c.inStock,
              }))}
              revenuePerTH={revenuePerTH}
            />
          </div>
        </div>
      </section>

      {/* ── Tech specs ── */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-16">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-px bg-outline-variant flex-1" />
          <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest whitespace-nowrap text-base">
            Технічні Характеристики
          </h2>
          <div className="h-px bg-outline-variant flex-1" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {specs.map((s) => (
            <div key={s.label} className="bg-card border-card rounded-lg p-5 flex flex-col gap-2 hover-primary-border transition-colors duration-300">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">
                {s.label}
              </span>
              <span className="font-technical-data text-technical-data text-primary text-base">
                {s.value}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Similar models ── */}
      {similar.length > 0 && (
        <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px bg-outline-variant flex-1" />
            <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest whitespace-nowrap text-base">
              Схожі Моделі
            </h2>
            <div className="h-px bg-outline-variant flex-1" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
            {similar.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className="group bg-card border-card rounded-lg overflow-hidden hover-primary-border transition-colors duration-300 flex flex-col"
              >
                <div className="relative h-36 bg-surface flex items-center justify-center">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2/3 h-2/3 bg-primary/5 blur-[40px] rounded-full" />
                  <span className="material-symbols-outlined text-outline-variant group-hover:text-primary/40 transition-colors text-[48px] relative z-10">memory</span>
                  <span className={`absolute top-2 left-2 chip px-2 py-0.5 text-[9px] font-technical-data uppercase ${p.inStock ? "bg-[#1a2b1a] text-green-400" : ""}`}>
                    {p.inStock ? "В наявності" : "Замовлення"}
                  </span>
                </div>
                <div className="p-4 border-t border-[#2e2d2b] flex flex-col gap-1 flex-1">
                  <span className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest">{p.algorithm}</span>
                  <h3 className="font-technical-data text-technical-data text-on-surface text-sm leading-snug">{p.name}</h3>
                  <p className="font-headline-md text-headline-md text-primary mt-auto pt-2 text-base">
                    ${p.priceUSDT.toLocaleString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div className="flex justify-center mt-10">
            <Link href="/products" className="btn-ghost py-3 px-8 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center gap-2 text-xs">
              <span className="material-symbols-outlined text-[16px]">grid_view</span>
              Весь каталог
            </Link>
          </div>
        </section>
      )}

    </div>
  );
}
