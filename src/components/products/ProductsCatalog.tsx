"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import type { Product } from "@/lib/sheets";

const ALGO_OPTIONS = ["Всі", "SHA256", "Scrypt", "KHeavyHash", "EtHash", "Blake2B", "X11"];

function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group bg-card border-card rounded-lg overflow-hidden hover-primary-border transition-colors duration-300 flex flex-col"
    >
      <div className="relative h-44 bg-surface flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface/60" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-primary/5 blur-[60px] rounded-full" />
        <span className="material-symbols-outlined text-outline-variant group-hover:text-primary/40 transition-colors text-[64px] relative z-10">
          memory
        </span>
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

export default function ProductsCatalog({ products }: { products: Product[] }) {
  const [search, setSearch] = useState("");
  const [algo, setAlgo] = useState("Всі");
  const [stockOnly, setStockOnly] = useState(false);

  const algorithms = useMemo(() => {
    const set = new Set(products.map((p) => p.algorithm));
    return ["Всі", ...Array.from(set)];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (stockOnly && !p.inStock) return false;
      if (algo !== "Всі" && p.algorithm !== algo) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.algorithm.toLowerCase().includes(q) ||
          p.hashrate.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, search, algo, stockOnly]);

  return (
    <>
      {/* Page header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="h-px bg-outline-variant flex-1" />
        <h1 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest whitespace-nowrap">
          Каталог ASIC
        </h1>
        <div className="h-px bg-outline-variant flex-1" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        {/* Search */}
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Пошук моделі..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-[#2e2d2b] rounded pl-9 pr-4 py-2.5 font-technical-data text-technical-data text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/60 transition-colors"
          />
        </div>

        {/* Stock toggle */}
        <button
          onClick={() => setStockOnly(!stockOnly)}
          className={`px-4 py-2.5 rounded border font-label-caps text-label-caps uppercase tracking-widest transition-colors whitespace-nowrap ${
            stockOnly
              ? "border-primary text-primary bg-primary/10"
              : "border-[#2e2d2b] text-on-surface-variant hover:border-primary/50"
          }`}
        >
          <span className="material-symbols-outlined text-[14px] mr-1 align-middle">inventory</span>
          В наявності
        </button>
      </div>

      {/* Algorithm chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        {algorithms.map((a) => (
          <button
            key={a}
            onClick={() => setAlgo(a)}
            className={`px-3 py-1 rounded text-[11px] font-label-caps uppercase tracking-widest transition-colors ${
              algo === a
                ? "bg-primary text-on-primary"
                : "chip hover:border-primary/50"
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest mb-6">
        {filtered.length} моделей
      </p>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center py-24 gap-4 text-on-surface-variant">
          <span className="material-symbols-outlined text-[48px]">search_off</span>
          <p className="font-body-md text-body-md">Нічого не знайдено. Спробуйте інший запит.</p>
          <button
            onClick={() => { setSearch(""); setAlgo("Всі"); setStockOnly(false); }}
            className="btn-ghost px-6 py-2 rounded font-label-caps text-label-caps uppercase tracking-widest text-xs"
          >
            Скинути фільтри
          </button>
        </div>
      )}
    </>
  );
}
