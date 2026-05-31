import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Сервіси | Trade M",
  description: "Ремонт та діагностика ASIC-майнерів, прошивка, налаштування та майнінг-готель в Україні.",
};

const SERVICES = [
  {
    icon: "build",
    title: "Ремонт та Діагностика",
    short: "Відновлення несправних майнерів будь-якої складності",
    desc: "Власна сертифікована майстерня у Дніпрі та Києві. Оригінальні запчастини зі складу — без очікування постачання. Гарантія на виконані роботи 3 місяці.",
    items: [
      "Повна діагностика хешбордів, PSU та плати управління",
      "Заміна ASIC-чипів: BM1370, BM1368, BM1366, BM1362",
      "Ремонт та заміна блоків живлення",
      "Усунення короткого замикання та наслідків перегріву",
      "Чищення, нанесення термопасти, заміна вентиляторів",
      "Стрес-тест під навантаженням 24+ год з протоколом",
    ],
    price: "Від $30",
    time: "24–72 год",
  },
  {
    icon: "settings",
    title: "Прошивка та Налаштування",
    short: "Максимальна прибутковість під ваш тариф електроенергії",
    desc: "Індивідуальний підбір режиму роботи для вашого тарифу та умов охолодження. Підтримуємо Antminer, Whatsminer, Avalon та інші платформи.",
    items: [
      "Оновлення офіційної прошивки до останньої версії",
      "Встановлення кастомної OS: Braiins OS+, VNish, LuxOS",
      "Налаштування майнінг-пулу, воркера та резервного пулу",
      "Розгін та підбір оптимального профілю хешрейт/енергія",
      "Налаштування авто-тюнінгу під температурний діапазон",
      "Підключення моніторингу, сповіщень та Telegram-бота",
    ],
    price: "Від $20",
    time: "1–4 год",
  },
  {
    icon: "warehouse",
    title: "Майнінг-Готель",
    short: "Промисловий об'єкт з тарифом від $0.07/кВт·год",
    desc: "Виділений майданчик із промисловим живленням 380V, надпотужним охолодженням та цілодобовою охороною. Ви отримуєте щомісячний звіт та доступ до онлайн-моніторингу.",
    items: [
      "Промисловий об'єкт 380V / 50 Hz, виділений трансформатор",
      "Конкурентний тариф $0.07–$0.09/кВт·год (залежно від обсягу)",
      "Потужна вентиляція та кондиціонування — температура до +25°C",
      "Відеоспостереження 24/7, охоронна сигналізація",
      "Цілодобовий технічний моніторинг, перезавантаження на запит",
      "Щомісячний детальний звіт про споживання та хешрейт",
    ],
    price: "$0.07–0.09/кВт·год",
    time: "Від 1 місяця",
  },
];

const FAQ = [
  {
    q: "Скільки коштує діагностика?",
    a: "Безкоштовна при замовленні ремонту. Якщо ви відмовляєтесь від ремонту — $10. Висновок надаємо письмово.",
  },
  {
    q: "Яка гарантія після ремонту?",
    a: "3 місяці на виконані роботи. На замінені компоненти — гарантія виробника. Якщо поломка повторилась — усуваємо безкоштовно.",
  },
  {
    q: "Як здати пристрій на ремонт?",
    a: "Самовивіз у Київ або Дніпро. Також приймаємо відправлення Новою Поштою — пакуємо та повертаємо за наш рахунок.",
  },
  {
    q: "Які мінімальні вимоги для майнінг-готелю?",
    a: "Від 1 пристрою. Укладаємо договір, надаємо доступ до онлайн-моніторингу та щомісячний звіт.",
  },
  {
    q: "Чи можна встановити кастомну прошивку на будь-який майнер?",
    a: "Braiins OS+ та VNish підтримують більшість моделей Antminer. Для Whatsminer — LuxOS. Уточнюйте сумісність для вашої моделі.",
  },
  {
    q: "Скільки часу займає прошивка та налаштування?",
    a: "Як правило 1–4 години. Дистанційно — якщо майнер підключений до мережі. Виїзд або сервісний центр — за домовленістю.",
  },
  {
    q: "Яке живлення у майнінг-готелі?",
    a: "Промислова мережа 380V / 50Hz з виділеним трансформатором. ДБЖ на критичній інфраструктурі, автоматичне переключення.",
  },
  {
    q: "Чи можна відвідати майнінг-готель особисто?",
    a: "Так, за попередньою домовленістю. Надаємо екскурсію та показуємо умови розміщення вашого обладнання.",
  },
];

export default function ServicesPage() {
  return (
    <div className="pb-section-gap">

      {/* Hero */}
      <section className="relative py-24 px-margin-mobile md:px-margin-desktop overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        </div>
        <div className="max-w-container-max mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-8 bg-primary" />
            <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest">
              Trade M
            </span>
          </div>
          <h1 className="font-display-lg text-display-lg text-on-surface uppercase leading-none mb-6">
            Наші <span className="text-primary">Сервіси</span>
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
            Повний цикл обслуговування ASIC-майнерів — від ремонту до розміщення на промисловому об&apos;єкті.
          </p>
        </div>
      </section>

      {/* Services cards */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-section-gap">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {SERVICES.map((s) => (
            <div key={s.title} className="bg-card border-card rounded-lg p-8 flex flex-col gap-5 hover-primary-border transition-colors duration-300 cursor-default">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-primary text-[36px] shrink-0">{s.icon}</span>
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest mb-1">
                    {s.title}
                  </h2>
                  <p className="font-label-caps text-[10px] text-primary uppercase tracking-widest">{s.short}</p>
                </div>
              </div>

              <p className="font-body-md text-body-md text-on-surface-variant text-sm leading-relaxed">
                {s.desc}
              </p>

              <ul className="space-y-2 flex-1">
                {s.items.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary text-[14px] mt-0.5 shrink-0">check_circle</span>
                    <span className="font-body-md text-body-md text-on-surface-variant text-sm">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="border-t border-[#2e2d2b] pt-4 flex justify-between items-center">
                <div>
                  <p className="font-label-caps text-label-caps text-primary uppercase tracking-widest">{s.price}</p>
                  <p className="font-label-caps text-label-caps text-on-surface-variant text-[10px] uppercase tracking-wider">{s.time}</p>
                </div>
                <Link href="/contact" className="btn-ghost px-4 py-2 rounded font-label-caps text-label-caps uppercase tracking-widest text-xs flex items-center gap-1">
                  Замовити
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-section-gap">
        <div className="flex items-center gap-4 mb-10">
          <div className="h-px bg-outline-variant flex-1" />
          <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest whitespace-nowrap">
            Часті Питання
          </h2>
          <div className="h-px bg-outline-variant flex-1" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FAQ.map((item) => (
            <div key={item.q} className="bg-card border-card rounded-lg p-6">
              <h3 className="font-headline-md text-headline-md text-on-surface text-base mb-2">{item.q}</h3>
              <p className="font-body-md text-body-md text-on-surface-variant text-sm">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="bg-card border-card rounded-lg p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{ backgroundImage: "radial-gradient(#ecc246 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          <div className="relative z-10 space-y-4">
            <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest">
              Готові до роботи
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-lg mx-auto">
              Зв&apos;яжіться з нами, щоб отримати консультацію або здати пристрій на сервіс.
            </p>
            <div className="flex flex-wrap gap-4 justify-center pt-2">
              <Link href="/contact" className="btn-primary py-4 px-8 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-transform">
                <span className="material-symbols-outlined text-[18px]">contact_support</span>
                Зв&apos;язатися
              </Link>
              <Link href="/products" className="btn-ghost py-4 px-8 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                Каталог
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
