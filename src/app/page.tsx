import Link from "next/link";
import { getTopProducts, type Product } from "@/lib/sheets";

export const revalidate = 3600; // refresh every hour

function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.id}`} className="group bg-card border-card rounded-lg overflow-hidden hover-primary-border transition-colors duration-300 flex flex-col">
      {/* Image placeholder — glow effect */}
      <div className="relative h-44 bg-surface flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface/60" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-primary/5 blur-[60px] rounded-full" />
        <span className="material-symbols-outlined text-outline-variant group-hover:text-primary/40 transition-colors text-[64px] relative z-10">
          memory
        </span>
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2 z-20">
          {product.isNew && (
            <span className="chip px-2 py-0.5 font-technical-data text-[10px] uppercase tracking-wider">
              Новинка
            </span>
          )}
          <span className={`chip px-2 py-0.5 font-technical-data text-[10px] uppercase tracking-wider ${
            product.inStock ? "bg-[#1a2b1a] text-green-400" : ""
          }`}>
            {product.inStock ? "В наявності" : "Під замовлення"}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-5 flex flex-col gap-2 border-t border-[#2e2d2b] flex-1">
        <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">
          {product.algorithm}
        </span>
        <h3 className="font-technical-data text-technical-data text-on-surface leading-snug">
          {product.name}
        </h3>
        <div className="flex gap-4 mt-1">
          {product.hashrate && (
            <span className="font-label-caps text-label-caps text-on-surface-variant">
              {product.hashrate}
            </span>
          )}
          <span className="font-label-caps text-label-caps text-on-surface-variant">
            {product.powerW} W
          </span>
        </div>
        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="font-headline-md text-headline-md text-primary">
            ${product.priceUSDT.toLocaleString()}
          </span>
          <span className="btn-ghost px-4 py-2 rounded font-label-caps text-label-caps uppercase tracking-widest text-xs transition-colors">
            Деталі
          </span>
        </div>
      </div>
    </Link>
  );
}

const SERVICES = [
  {
    icon: "build",
    title: "Ремонт та Діагностика",
    desc: "Повна діагностика несправностей, ремонт хешбордів та блоків живлення протягом 24 годин.",
  },
  {
    icon: "settings",
    title: "Прошивка та Налаштування",
    desc: "Оновлення прошивки, налаштування пулу, розгін під ваш тариф електроенергії.",
  },
  {
    icon: "warehouse",
    title: "Майнінг-Готель",
    desc: "Розміщення обладнання на промисловому об'єкті. Тариф від $0.07/кВт·год, 24/7 моніторинг.",
  },
];

export default async function Home() {
  const products = await getTopProducts(8);

  return (
    <div className="space-y-section-gap pb-section-gap">

      {/* ── Hero ── */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden px-margin-mobile md:px-margin-desktop">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[100px]" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: "radial-gradient(#ecc246 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
        </div>

        <div className="max-w-container-max mx-auto w-full relative z-10">
          <div className="max-w-2xl space-y-8">
            {/* Label */}
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-primary" />
              <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest">
                Industrial Excellence
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-display-lg text-display-lg text-on-surface uppercase leading-none">
              Преміум{" "}
              <span className="text-primary">ASIC</span>
              <br />
              Майнери
            </h1>

            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg">
              Antminer, Whatsminer — офіційні постачальники. Доставка з Китаю 10–14 днів.
              Фіксована ціна під час замовлення.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 pt-2">
              <Link href="/products">
                <button className="btn-primary py-4 px-8 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-transform">
                  <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                  Каталог товарів
                </button>
              </Link>
              <Link href="/contact">
                <button className="btn-ghost py-4 px-8 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">contact_support</span>
                  Консультація
                </button>
              </Link>
            </div>

            {/* Trust stats */}
            <div className="flex flex-wrap gap-8 pt-4 border-t border-outline-variant/30">
              {[
                { value: "10–14", label: "Днів доставка" },
                { value: "24/7", label: "Підтримка" },
                { value: "Київ / Дніпро", label: "Офіси" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="font-headline-md text-headline-md text-primary">{s.value}</div>
                  <div className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Top Products ── */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        {/* Heading */}
        <div className="flex items-center gap-4 mb-10">
          <div className="h-px bg-outline-variant flex-1" />
          <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest whitespace-nowrap">
            Топ Моделі
          </h2>
          <div className="h-px bg-outline-variant flex-1" />
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <p className="text-center font-body-md text-body-md text-on-surface-variant py-16">
            Завантаження каталогу...
          </p>
        )}

        <div className="flex justify-center mt-10">
          <Link href="/products">
            <button className="btn-ghost py-3 px-8 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">grid_view</span>
              Весь каталог
            </button>
          </Link>
        </div>
      </section>

      {/* ── Services ── */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <div className="h-px bg-outline-variant flex-1" />
          <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest whitespace-nowrap">
            Наші Сервіси
          </h2>
          <div className="h-px bg-outline-variant flex-1" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {SERVICES.map((s) => (
            <div
              key={s.title}
              className="bg-card border-card rounded-lg p-8 flex flex-col gap-4 hover-primary-border transition-colors duration-300"
            >
              <span className="material-symbols-outlined text-primary text-[32px]">
                {s.icon}
              </span>
              <h3 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest">
                {s.title}
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant">{s.desc}</p>
              <Link
                href="/services"
                className="font-label-caps text-label-caps text-primary uppercase tracking-widest hover:text-secondary transition-colors mt-auto flex items-center gap-1"
              >
                Детальніше
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Calculator CTA ── */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="bg-card border-card rounded-lg p-8 md:p-12 relative overflow-hidden">
          {/* Dot grid bg */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#ecc246 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest">
                Калькулятор Прибутковості
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Розрахуйте окупність вашого майнера. Враховуємо поточний курс та складність мережі.
              </p>
            </div>
            <Link href="/calculator" className="shrink-0">
              <button className="btn-primary py-4 px-8 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-transform whitespace-nowrap">
                <span className="material-symbols-outlined text-[18px]">calculate</span>
                Розрахувати
              </button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
