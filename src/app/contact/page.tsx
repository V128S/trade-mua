import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Контакти | Trade M",
  description: "Зв'яжіться з Trade M — продаж ASIC-майнерів, сервіс та консультації. Київ, Дніпро.",
};

const OFFICES = [
  { city: "Київ", icon: "location_on", desc: "Центральний офіс. Прийом обладнання за попереднім записом." },
  { city: "Дніпро", icon: "location_on", desc: "Регіональне представництво. Сервісний центр та майнінг-готель." },
];

export default function ContactPage() {
  return (
    <div className="pb-section-gap">

      {/* Hero */}
      <section className="relative py-20 px-margin-mobile md:px-margin-desktop overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />
        </div>
        <div className="max-w-container-max mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-8 bg-primary" />
            <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest">Зв&apos;язок</span>
          </div>
          <h1 className="font-display-lg text-display-lg text-on-surface uppercase leading-none mb-4">
            Контакти
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg">
            Готові відповісти на ваші питання щодо купівлі, сервісу або майнінг-готелю.
          </p>
        </div>
      </section>

      {/* Contacts grid */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-section-gap">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">

          {/* Phone */}
          <a
            href="tel:+380974225060"
            className="bg-card border-card rounded-lg p-8 flex flex-col gap-5 hover-primary-border transition-colors duration-300 group"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[28px]">phone</span>
              <p className="font-label-caps text-sm text-on-surface-variant uppercase tracking-widest group-hover:text-primary transition-colors">Телефон</p>
            </div>
            <div>
              <p className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors">
                097-422-50-60
              </p>
              <p className="font-technical-data text-technical-data text-on-surface-variant mt-1">
                Денис — консультації з продажу та сервісу
              </p>
            </div>
          </a>

          {/* Telegram */}
          <a
            href="https://t.me/DenisHandsome"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-card border-card rounded-lg p-8 flex flex-col gap-5 hover-primary-border transition-colors duration-300 group"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[28px]">send</span>
              <p className="font-label-caps text-sm text-on-surface-variant uppercase tracking-widest group-hover:text-primary transition-colors">Telegram</p>
            </div>
            <div>
              <p className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors">
                @DenisHandsome
              </p>
              <p className="font-technical-data text-technical-data text-on-surface-variant mt-1">
                Найшвидший спосіб зв&apos;язатися
              </p>
            </div>
          </a>

          {/* Working hours */}
          <a
            href="https://t.me/DenisHandsome"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-card border-card rounded-lg p-8 flex flex-col gap-5 hover-primary-border transition-colors duration-300 group"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[28px]">schedule</span>
              <p className="font-label-caps text-sm text-on-surface-variant uppercase tracking-widest group-hover:text-primary transition-colors">Графік роботи</p>
            </div>
            <div>
              <p className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors">
                Пн–Сб, 09:00–20:00
              </p>
              <p className="font-technical-data text-technical-data text-on-surface-variant mt-1">
                За Київським часом. Telegram — цілодобово.
              </p>
            </div>
          </a>
        </div>
      </section>

      {/* Offices */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-section-gap">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-px bg-outline-variant flex-1" />
          <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest whitespace-nowrap">Наші Офіси</h2>
          <div className="h-px bg-outline-variant flex-1" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter max-w-2xl mx-auto">
          {OFFICES.map((o) => (
            <div key={o.city} className="bg-card border-card rounded-lg p-6 flex gap-4">
              <span className="material-symbols-outlined text-primary text-[28px] shrink-0">{o.icon}</span>
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface text-base uppercase tracking-widest mb-1">{o.city}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant text-sm">{o.desc}</p>
                <a
                  href="https://t.me/DenisHandsome"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-3 font-label-caps text-label-caps text-primary uppercase tracking-widest text-[10px] hover:text-secondary transition-colors"
                >
                  Уточнити адресу
                  <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick actions */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <Link href="/products" className="w-full btn-ghost py-4 px-6 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[18px]">inventory_2</span>
            Переглянути каталог
          </Link>
          <Link href="/calculator" className="w-full btn-ghost py-4 px-6 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[18px]">calculate</span>
            Калькулятор
          </Link>
        </div>
      </section>

    </div>
  );
}
