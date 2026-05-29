"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/sheets";
import { getProductImage } from "@/lib/product-images";

export default function HeroCarousel({ products }: { products: Product[] }) {
  const items = [...products, ...products]; // duplicate for seamless infinite loop

  return (
    <div className="relative h-[540px] overflow-hidden select-none" aria-label="Топ майнери">
      {/* Top fade */}
      <div className="hero-fade-top absolute top-0 inset-x-0 h-32 z-10 pointer-events-none" />
      {/* Bottom fade */}
      <div className="hero-fade-bottom absolute bottom-0 inset-x-0 h-32 z-10 pointer-events-none" />

      {/* Scrolling track — duplicate list gives seamless loop at -50% */}
      <div className="animate-hero-scroll flex flex-col gap-3">
        {items.map((product, i) => {
          const imgSrc = getProductImage(product.name);
          return (
            <Link
              key={`${product.id}-${i}`}
              href={`/products/${product.id}`}
              className="group bg-card border-card rounded-lg overflow-hidden shrink-0 hover-primary-border transition-colors duration-300"
            >
              {/* Image */}
              <div className="relative h-44 bg-white flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/20" />
                {imgSrc ? (
                  <Image
                    src={imgSrc}
                    alt={product.name}
                    width={150}
                    height={150}
                    className="relative z-10 object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <span className="material-symbols-outlined text-outline-variant text-[64px] relative z-10">memory</span>
                )}
                {/* Stock badge */}
                <span className={`absolute top-2 left-2 chip px-2 py-0.5 text-[9px] font-technical-data uppercase z-20 ${product.inStock ? "bg-[#1a2b1a] text-green-400" : ""}`}>
                  {product.inStock ? "В наявності" : "Замовлення"}
                </span>
              </div>

              {/* Name + price */}
              <div className="px-4 py-3 border-t border-[#2e2d2b] flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-technical-data text-technical-data text-on-surface text-sm leading-snug truncate">
                    {product.name}
                  </p>
                  <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mt-0.5">
                    {product.hashrate}
                  </p>
                </div>
                <span className="font-headline-md text-headline-md text-primary text-base shrink-0">
                  ${product.priceUSDT.toLocaleString()}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
