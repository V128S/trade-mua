import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Кошик | Trade M",
};

export default function CartPage() {
  return (
    <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-24 pb-section-gap flex flex-col items-center text-center gap-8">
      <span className="material-symbols-outlined text-outline-variant text-[80px]">shopping_cart</span>
      <div className="space-y-2">
        <h1 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest">
          Кошик порожній
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
          Додайте товари з каталогу або зв&apos;яжіться з нами напряму — ми підберемо найкращий варіант.
        </p>
      </div>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link href="/products" className="btn-primary py-4 px-8 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-transform">
          <span className="material-symbols-outlined text-[18px]">inventory_2</span>
          Перейти до каталогу
        </Link>
        <Link href="/contact" className="btn-ghost py-4 px-8 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">contact_support</span>
          Консультація
        </Link>
      </div>
    </div>
  );
}
