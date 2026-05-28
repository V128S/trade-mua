import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Про компанію | Trade M",
  description: "Trade M — офіційний постачальник ASIC-майнерів в Україні. Antminer, Whatsminer, повний сервіс.",
};

const STATS = [
  { value: "300+", label: "Клієнтів" },
  { value: "1000+", label: "Пристроїв продано" },
  { value: "3 роки", label: "Досвіду" },
  { value: "24/7", label: "Підтримка" },
];

const VALUES = [
  { icon: "verified", title: "Офіційні поставки", desc: "Прямі контракти з виробниками. Лише оригінальне обладнання з гарантією." },
  { icon: "speed", title: "Швидка доставка", desc: "Доставка з Китаю за 10–14 днів. Фіксована ціна на весь час доставки." },
  { icon: "support_agent", title: "Повний сервіс", desc: "Ремонт, прошивка, налаштування та розміщення — все під одним дахом." },
  { icon: "lock", title: "Прозорі умови", desc: "Договір, гарантія, звітність. Ніяких прихованих платежів." },
];

export default function AboutPage() {
  return (
    <div className="pb-section-gap">

      {/* Hero */}
      <section className="relative py-24 px-margin-mobile md:px-margin-desktop overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{ backgroundImage: "radial-gradient(#ecc246 1px, transparent 1px)", backgroundSize: "24px 24px" }}
          />
        </div>
        <div className="max-w-container-max mx-auto relative z-10 max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-8 bg-primary" />
            <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest">Industrial Excellence</span>
          </div>
          <h1 className="font-display-lg text-display-lg text-on-surface uppercase leading-none mb-6">
            Trade <span className="text-primary">M</span>
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Ми — команда фахівців із майнінгу, яка виросла з власного досвіду управління фермами.
            Trade M заснована з єдиною метою: зробити промисловий майнінг доступним і прозорим в Україні.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-section-gap">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="bg-card border-card rounded-lg p-6 text-center">
              <p className="font-display-lg text-[40px] leading-none text-primary mb-2">{s.value}</p>
              <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-section-gap">
        <div className="flex items-center gap-4 mb-10">
          <div className="h-px bg-outline-variant flex-1" />
          <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest whitespace-nowrap">Наші Принципи</h2>
          <div className="h-px bg-outline-variant flex-1" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-gutter">
          {VALUES.map((v) => (
            <div key={v.title} className="bg-card border-card rounded-lg p-8 flex gap-5">
              <span className="material-symbols-outlined text-primary text-[28px] shrink-0 mt-1">{v.icon}</span>
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface text-base uppercase tracking-widest mb-2">{v.title}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/products" className="btn-primary py-4 px-8 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-[18px]">inventory_2</span>
            Каталог товарів
          </Link>
          <Link href="/contact" className="btn-ghost py-4 px-8 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">contact_support</span>
            Зв&apos;язатися
          </Link>
        </div>
      </section>

    </div>
  );
}
