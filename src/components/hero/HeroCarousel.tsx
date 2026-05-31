"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { Product } from "@/lib/sheets";
import { getProductImage } from "@/lib/product-images";

export default function HeroCarousel({ products }: { products: Product[] }) {
  const t = useTranslations("home");
  const tp = useTranslations("products");
  const items = [...products, ...products]; // duplicate for seamless infinite loop

  return (
    <div className="relative h-[500px] overflow-hidden select-none" aria-label={t("carouselAriaLabel")}>
      {/* Top fade */}
      <div className="hero-fade-top absolute top-0 inset-x-0 h-24 z-10 pointer-events-none" />
      {/* Bottom fade */}
      <div className="hero-fade-bottom absolute bottom-0 inset-x-0 h-24 z-10 pointer-events-none" />

      {/* Scrolling track */}
      <div className="animate-hero-scroll flex flex-col gap-2">
        {items.map((product, i) => {
          const imgSrc = getProductImage(product.name);
          return (
            <Link
              key={`${product.id}-${i}`}
              href={`/products/${product.id}`}
              className="group bg-card border-card rounded-lg overflow-hidden shrink-0 hover-primary-border transition-colors duration-300 flex items-center gap-3 px-3 py-2.5"
            >
              {/* Image */}
              <div className="relative w-16 h-16 bg-white rounded flex items-center justify-center shrink-0 overflow-hidden">
                {imgSrc ? (
                  <Image
                    src={imgSrc}
                    alt={product.name}
                    fill
                    sizes="64px"
                    className="object-contain p-1.5 group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <span className="material-symbols-outlined text-outline-variant text-[32px]">memory</span>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="font-technical-data text-sm text-on-surface leading-tight truncate">
                  {product.name}
                </p>
                <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mt-0.5">
                  {product.hashrate}
                </p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="font-headline-md text-primary text-sm">
                    ${product.priceUSDT.toLocaleString()}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${product.inStock ? "bg-green-400" : "bg-yellow-400"}`}
                    title={product.inStock ? tp("inStock") : tp("onOrder")}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
