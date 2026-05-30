import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/sheets";
import { getProductImage } from "@/lib/product-images";

export function ProductCard({ product }: { product: Product }) {
  const imgSrc = getProductImage(product.name);
  return (
    <Link
      href={`/products/${product.id}`}
      className="group bg-card border-card rounded-lg overflow-hidden hover-primary-border transition-colors duration-300 flex flex-col"
    >
      <div className="relative h-44 bg-white flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/30" />
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={product.name}
            width={160}
            height={160}
            className="relative z-10 object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <span className="material-symbols-outlined text-outline-variant group-hover:text-primary/40 transition-colors text-[64px] relative z-10">
            memory
          </span>
        )}
        <div className="absolute top-3 left-3 flex gap-2 z-20">
          {product.isNew && (
            <span className="chip px-2 py-0.5 font-technical-data text-[10px] uppercase tracking-wider">
              Новинка
            </span>
          )}
          <span
            className={`chip px-2 py-0.5 font-technical-data text-[10px] uppercase tracking-wider ${
              product.inStock ? "bg-[#1a2b1a] text-green-400" : ""
            }`}
          >
            {product.inStock ? "В наявності" : "Під замовлення"}
          </span>
        </div>
      </div>

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
