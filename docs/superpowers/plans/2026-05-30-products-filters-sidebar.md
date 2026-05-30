# Products Catalog — Фільтри з сайдбаром: План реалізації

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Додати сайдбар з фільтрами (виробник, алгоритм, монети, охолодження, ціна, потужність) та сортуванням до сторінки `/products`; на мобільному — drawer знизу.

**Architecture:** Хук `useProductFilters` ізолює весь стан та логіку фільтрації; `ProductsFilters` — чиста презентація сайдбара; `ProductsMobileDrawer` — обгортка для мобільного drawer; `ProductsCatalog` — оркестратор, що з'єднує все разом. Монети і тип охолодження виводяться з `algorithm`/`name` через маппінги, нових полів у БД не потрібно.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, нативний `<input type="range">` (без зовнішніх бібліотек)

---

## Файлова структура

| Дія | Файл | Відповідальність |
|---|---|---|
| NEW | `src/lib/product-filters-meta.ts` | `ALGO_COINS` маппінг + `getCoolingType()` |
| NEW | `src/hooks/useProductFilters.ts` | Весь стан + логіка фільтрації |
| NEW | `src/components/products/ProductCard.tsx` | Картка товару (витягнута з Catalog) |
| NEW | `src/components/products/ProductsFilters.tsx` | Панель фільтрів (сайдбар + drawer-вміст) |
| NEW | `src/components/products/ProductsMobileDrawer.tsx` | Mobile drawer обгортка |
| MODIFY | `src/components/products/ProductsCatalog.tsx` | Оркестратор (рефакторинг) |
| MODIFY | `src/app/globals.css` | CSS для dual range slider |

---

## Task 1: Маппінги даних

**Files:**
- Create: `src/lib/product-filters-meta.ts`

- [ ] **Крок 1: Створити файл з маппінгами**

```ts
// src/lib/product-filters-meta.ts

export const ALGO_COINS: Record<string, string[]> = {
  sha256:     ["BTC", "BCH"],
  scrypt:     ["LTC", "DOGE"],
  kheavyhash: ["KAS"],
  randomx:    ["XMR"],
  versahash:  ["ALPH"],
  x11:        ["DASH"],
  equihash:   ["ZEC", "ZEN"],
  ethhash:    ["ETC"],
  handshake:  ["HNS"],
  eaglesong:  ["CKB"],
  blake2b:    ["SC"],
};

export type CoolingType = "Повітряне" | "Hydro" | "Immersive";

export function getCoolingType(name: string): CoolingType {
  if (/hyd/i.test(name)) return "Hydro";
  if (/imm/i.test(name)) return "Immersive";
  return "Повітряне";
}
```

- [ ] **Крок 2: Перевірити вручну**

Відкрити Node REPL або `console.log` в dev: переконатися що `getCoolingType("Antminer S21 Hyd")` повертає `"Hydro"`, а `getCoolingType("Antminer S21")` — `"Повітряне"`.

- [ ] **Крок 3: Комміт**

```bash
git add src/lib/product-filters-meta.ts
git commit -m "feat: add product filter meta — algo→coins mapping, cooling type detector"
```

---

## Task 2: Хук `useProductFilters`

**Files:**
- Create: `src/hooks/useProductFilters.ts`

- [ ] **Крок 1: Створити хук**

```ts
// src/hooks/useProductFilters.ts
"use client";
import { useState, useMemo, type Dispatch, type SetStateAction } from "react";
import type { Product } from "@/lib/sheets";
import { ALGO_COINS, getCoolingType } from "@/lib/product-filters-meta";

export type SortOption =
  | "price_desc"
  | "price_asc"
  | "power_asc"
  | "power_desc"
  | "new_first";

export interface FilterState {
  search: string;
  stockOnly: boolean;
  brands: string[];
  algorithms: string[];
  coins: string[];
  coolingTypes: string[];
  priceRange: [number, number];
  powerRange: [number, number];
  sortBy: SortOption;
}

export interface Facets {
  brands: Record<string, number>;
  algorithms: Record<string, number>;
  coins: Record<string, number>;
  coolingTypes: Record<string, number>;
}

export interface GlobalRanges {
  price: [number, number];
  power: [number, number];
}

export interface FilterSetters {
  setSearch: (v: string) => void;
  setStockOnly: (v: boolean) => void;
  toggleBrand: (v: string) => void;
  toggleAlgorithm: (v: string) => void;
  toggleCoin: (v: string) => void;
  toggleCooling: (v: string) => void;
  setPriceRange: (v: [number, number]) => void;
  setPowerRange: (v: [number, number]) => void;
  setSortBy: (v: SortOption) => void;
}

function applyFilters(products: Product[], f: FilterState): Product[] {
  let r = products;
  if (f.search) {
    const q = f.search.toLowerCase();
    r = r.filter(p => p.name.toLowerCase().includes(q) || p.algorithm.toLowerCase().includes(q));
  }
  if (f.stockOnly)        r = r.filter(p => p.inStock);
  if (f.brands.length)    r = r.filter(p => f.brands.includes(p.brand));
  if (f.algorithms.length) r = r.filter(p => f.algorithms.includes(p.algorithm));
  if (f.coins.length) {
    r = r.filter(p =>
      (ALGO_COINS[p.algorithm.toLowerCase()] ?? []).some(c => f.coins.includes(c))
    );
  }
  if (f.coolingTypes.length) {
    r = r.filter(p => f.coolingTypes.includes(getCoolingType(p.name)));
  }
  r = r.filter(p => p.priceUSDT >= f.priceRange[0] && p.priceUSDT <= f.priceRange[1]);
  r = r.filter(p => p.powerW >= f.powerRange[0] && p.powerW <= f.powerRange[1]);
  switch (f.sortBy) {
    case "price_asc":  return [...r].sort((a, b) => a.priceUSDT - b.priceUSDT);
    case "power_asc":  return [...r].sort((a, b) => a.powerW - b.powerW);
    case "power_desc": return [...r].sort((a, b) => b.powerW - a.powerW);
    case "new_first":  return [...r].sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    default:           return [...r].sort((a, b) => b.priceUSDT - a.priceUSDT);
  }
}

function countBy<T>(arr: T[], key: (item: T) => string): Record<string, number> {
  return arr.reduce((acc, item) => {
    const k = key(item);
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function computeFacets(products: Product[], f: FilterState): Facets {
  const withoutBrands   = applyFilters(products, { ...f, brands: [] });
  const withoutAlgos    = applyFilters(products, { ...f, algorithms: [] });
  const withoutCoins    = applyFilters(products, { ...f, coins: [] });
  const withoutCooling  = applyFilters(products, { ...f, coolingTypes: [] });

  const coinsFacets: Record<string, number> = {};
  for (const p of withoutCoins) {
    for (const c of (ALGO_COINS[p.algorithm.toLowerCase()] ?? [])) {
      coinsFacets[c] = (coinsFacets[c] ?? 0) + 1;
    }
  }

  return {
    brands:       countBy(withoutBrands,  p => p.brand),
    algorithms:   countBy(withoutAlgos,   p => p.algorithm),
    coins:        coinsFacets,
    coolingTypes: countBy(withoutCooling, p => getCoolingType(p.name)),
  };
}

export function useProductFilters(products: Product[]) {
  const globalRanges = useMemo<GlobalRanges>(() => {
    if (!products.length) return { price: [0, 100000], power: [0, 10000] };
    const prices = products.map(p => p.priceUSDT);
    const powers = products.map(p => p.powerW);
    return {
      price: [Math.min(...prices), Math.max(...prices)],
      power: [Math.min(...powers), Math.max(...powers)],
    };
  }, [products]);

  const [search,       setSearch]       = useState("");
  const [stockOnly,    setStockOnly]    = useState(false);
  const [brands,       setBrands]       = useState<string[]>([]);
  const [algorithms,   setAlgorithms]   = useState<string[]>([]);
  const [coins,        setCoins]        = useState<string[]>([]);
  const [coolingTypes, setCoolingTypes] = useState<string[]>([]);
  const [priceRange,   setPriceRange]   = useState<[number, number]>(() => {
    const prices = products.map(p => p.priceUSDT);
    return prices.length ? [Math.min(...prices), Math.max(...prices)] : [0, 100000];
  });
  const [powerRange,   setPowerRange]   = useState<[number, number]>(() => {
    const powers = products.map(p => p.powerW);
    return powers.length ? [Math.min(...powers), Math.max(...powers)] : [0, 10000];
  });
  const [sortBy,       setSortBy]       = useState<SortOption>("price_desc");

  const toggle = (setter: Dispatch<SetStateAction<string[]>>) =>
    (val: string) => setter(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);

  const filters = useMemo<FilterState>(() => ({
    search, stockOnly, brands, algorithms, coins, coolingTypes, priceRange, powerRange, sortBy,
  }), [search, stockOnly, brands, algorithms, coins, coolingTypes, priceRange, powerRange, sortBy]);

  const filtered = useMemo(() => applyFilters(products, filters), [products, filters]);
  const facets   = useMemo(() => computeFacets(products, filters), [products, filters]);

  const activeCount = useMemo(() =>
    brands.length + algorithms.length + coins.length + coolingTypes.length +
    (stockOnly ? 1 : 0) +
    (priceRange[0] > globalRanges.price[0] || priceRange[1] < globalRanges.price[1] ? 1 : 0) +
    (powerRange[0] > globalRanges.power[0] || powerRange[1] < globalRanges.power[1] ? 1 : 0),
  [brands, algorithms, coins, coolingTypes, stockOnly, priceRange, powerRange, globalRanges]);

  const resetAll = () => {
    setSearch(""); setStockOnly(false);
    setBrands([]); setAlgorithms([]); setCoins([]); setCoolingTypes([]);
    setPriceRange(globalRanges.price); setPowerRange(globalRanges.power);
    setSortBy("price_desc");
  };

  return {
    filters,
    setters: {
      setSearch, setStockOnly,
      toggleBrand:      toggle(setBrands),
      toggleAlgorithm:  toggle(setAlgorithms),
      toggleCoin:       toggle(setCoins),
      toggleCooling:    toggle(setCoolingTypes),
      setPriceRange, setPowerRange, setSortBy,
    } satisfies FilterSetters,
    filtered,
    facets,
    globalRanges,
    activeCount,
    resetAll,
  };
}
```

- [ ] **Крок 2: Перевірити компіляцію TypeScript**

```bash
cd /Users/VI2US/Documents/TradeMua && npx tsc --noEmit 2>&1 | head -30
```

Очікується: без помилок (або тільки помилки з інших файлів, не з нового хука).

- [ ] **Крок 3: Комміт**

```bash
git add src/hooks/useProductFilters.ts
git commit -m "feat: add useProductFilters hook — filter state, facets, sorting"
```

---

## Task 3: Витягнути `ProductCard`

**Files:**
- Create: `src/components/products/ProductCard.tsx`
- Modify: `src/components/products/ProductsCatalog.tsx` (видалити локальний `ProductCard`)

- [ ] **Крок 1: Створити `ProductCard.tsx`**

Перенести функцію `ProductCard` (рядки 9–75 поточного `ProductsCatalog.tsx`) без змін:

```tsx
// src/components/products/ProductCard.tsx
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
```

- [ ] **Крок 2: Перевірити компіляцію**

```bash
cd /Users/VI2US/Documents/TradeMua && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Крок 3: Комміт**

```bash
git add src/components/products/ProductCard.tsx
git commit -m "refactor: extract ProductCard into its own file"
```

---

## Task 4: CSS для dual range slider

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Крок 1: Додати стилі в кінець `globals.css`**

Відкрити `src/app/globals.css` та додати в самий кінець файлу (після рядка 367):

```css
/* Dual range slider — transparent tracks for stacked inputs */
.dual-range-input {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  pointer-events: none;
  height: 20px;
  margin: 0;
  padding: 0;
  position: absolute;
  left: 0;
  width: 100%;
}
.dual-range-input::-webkit-slider-runnable-track {
  background: transparent;
  height: 4px;
  border: none;
}
.dual-range-input::-moz-range-track {
  background: transparent;
  height: 4px;
  border: none;
}
.dual-range-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 16px;
  width: 16px;
  border-radius: 50%;
  background: #ecc246;
  cursor: pointer;
  pointer-events: all;
  margin-top: -6px;
  box-shadow: 0 0 8px rgba(236, 194, 70, 0.4);
  position: relative;
  z-index: 1;
}
.dual-range-input::-moz-range-thumb {
  height: 16px;
  width: 16px;
  border-radius: 50%;
  background: #ecc246;
  cursor: pointer;
  pointer-events: all;
  border: none;
  box-shadow: 0 0 8px rgba(236, 194, 70, 0.4);
}
.dual-range-input:focus { outline: none; }

/* Native select — dark theme */
select.catalog-sort {
  -webkit-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23a09a8c' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
}
select.catalog-sort option {
  background: #1a1918;
  color: #e5e2db;
}
```

- [ ] **Крок 2: Комміт**

```bash
git add src/app/globals.css
git commit -m "style: add dual range slider and catalog sort select CSS"
```

---

## Task 5: `ProductsFilters` — панель фільтрів

**Files:**
- Create: `src/components/products/ProductsFilters.tsx`

- [ ] **Крок 1: Створити компонент**

```tsx
// src/components/products/ProductsFilters.tsx
"use client";
import { useState, type ReactNode } from "react";
import type { FilterState, FilterSetters, Facets, GlobalRanges } from "@/hooks/useProductFilters";

interface ProductsFiltersProps {
  filters: FilterState;
  setters: FilterSetters;
  facets: Facets;
  globalRanges: GlobalRanges;
  activeCount: number;
  resetAll: () => void;
}

function CustomCheckbox({
  checked, onChange, label, count,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  count?: number;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group py-1 select-none">
      <span
        className={`w-3.5 h-3.5 shrink-0 rounded-sm border transition-colors flex items-center justify-center ${
          checked
            ? "bg-primary border-primary"
            : "border-[#2e2d2b] group-hover:border-primary/60"
        }`}
      >
        {checked && (
          <span
            className="material-symbols-outlined text-[#0e0e0a]"
            style={{ fontSize: 10, fontVariationSettings: "'FILL' 1, 'wght' 700" }}
          >
            check
          </span>
        )}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <span
        className={`font-technical-data text-[13px] flex-1 transition-colors ${
          checked ? "text-on-surface" : "text-on-surface-variant group-hover:text-on-surface"
        }`}
      >
        {label}
      </span>
      {count !== undefined && (
        <span className="text-[11px] text-on-surface-variant/50 font-technical-data tabular-nums">
          {count}
        </span>
      )}
    </label>
  );
}

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#2e2d2b] py-3">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[11px]">
          {title}
        </span>
        <span
          className={`material-symbols-outlined text-[16px] text-on-surface-variant transition-transform duration-200 ${
            open ? "" : "-rotate-90"
          }`}
        >
          expand_more
        </span>
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}

function DualRangeSlider({
  min, max, value, onChange, format,
}: {
  min: number;
  max: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
  format: (v: number) => string;
}) {
  const range = max - min || 1;
  const leftPct  = ((value[0] - min) / range) * 100;
  const rightPct = ((max - value[1]) / range) * 100;

  return (
    <div className="pt-1 pb-2">
      <div className="flex justify-between mb-3 font-technical-data text-[12px] text-on-surface-variant tabular-nums">
        <span>{format(value[0])}</span>
        <span>{format(value[1])}</span>
      </div>
      <div className="relative h-5 flex items-center">
        {/* Track base */}
        <div className="absolute left-0 right-0 h-1 rounded-full bg-[#2e2d2b] pointer-events-none" />
        {/* Active fill */}
        <div
          className="absolute h-1 rounded-full bg-primary pointer-events-none"
          style={{ left: `${leftPct}%`, right: `${rightPct}%` }}
        />
        {/* Min thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={value[0]}
          onChange={e => onChange([Math.min(+e.target.value, value[1] - 1), value[1]])}
          className="dual-range-input"
        />
        {/* Max thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={value[1]}
          onChange={e => onChange([value[0], Math.max(+e.target.value, value[0] + 1)])}
          className="dual-range-input"
        />
      </div>
    </div>
  );
}

export function ProductsFilters({
  filters, setters, facets, globalRanges, activeCount, resetAll,
}: ProductsFiltersProps) {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#2e2d2b]">
        <span className="font-label-caps text-label-caps text-on-surface uppercase tracking-widest text-[11px]">
          Фільтри
        </span>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={resetAll}
            className="btn-ghost px-2 py-1 rounded font-label-caps text-[10px] uppercase tracking-widest"
          >
            Скинути все
          </button>
        )}
      </div>

      {/* В наявності */}
      <div className="border-b border-[#2e2d2b] pb-3 mb-0">
        <CustomCheckbox
          checked={filters.stockOnly}
          onChange={() => setters.setStockOnly(!filters.stockOnly)}
          label="В наявності"
        />
      </div>

      {/* Виробник */}
      {Object.keys(facets.brands).length > 0 && (
        <FilterSection title="Виробник">
          {Object.entries(facets.brands)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([brand, count]) => (
              <CustomCheckbox
                key={brand}
                checked={filters.brands.includes(brand)}
                onChange={() => setters.toggleBrand(brand)}
                label={brand}
                count={count}
              />
            ))}
        </FilterSection>
      )}

      {/* Алгоритм */}
      {Object.keys(facets.algorithms).length > 0 && (
        <FilterSection title="Алгоритм">
          {Object.entries(facets.algorithms)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([algo, count]) => (
              <CustomCheckbox
                key={algo}
                checked={filters.algorithms.includes(algo)}
                onChange={() => setters.toggleAlgorithm(algo)}
                label={algo.toUpperCase()}
                count={count}
              />
            ))}
        </FilterSection>
      )}

      {/* Монети */}
      {Object.keys(facets.coins).length > 0 && (
        <FilterSection title="Монети">
          {Object.entries(facets.coins)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([coin, count]) => (
              <CustomCheckbox
                key={coin}
                checked={filters.coins.includes(coin)}
                onChange={() => setters.toggleCoin(coin)}
                label={coin}
                count={count}
              />
            ))}
        </FilterSection>
      )}

      {/* Охолодження */}
      {Object.keys(facets.coolingTypes).length > 0 && (
        <FilterSection title="Охолодження">
          {Object.entries(facets.coolingTypes).map(([type, count]) => (
            <CustomCheckbox
              key={type}
              checked={filters.coolingTypes.includes(type)}
              onChange={() => setters.toggleCooling(type)}
              label={type}
              count={count}
            />
          ))}
        </FilterSection>
      )}

      {/* Ціна */}
      <FilterSection title="Ціна $">
        <DualRangeSlider
          min={globalRanges.price[0]}
          max={globalRanges.price[1]}
          value={filters.priceRange}
          onChange={setters.setPriceRange}
          format={v => `$${v.toLocaleString("uk-UA")}`}
        />
      </FilterSection>

      {/* Потужність */}
      <FilterSection title="Потужність W">
        <DualRangeSlider
          min={globalRanges.power[0]}
          max={globalRanges.power[1]}
          value={filters.powerRange}
          onChange={setters.setPowerRange}
          format={v => `${v.toLocaleString("uk-UA")} W`}
        />
      </FilterSection>
    </div>
  );
}
```

- [ ] **Крок 2: Перевірити компіляцію**

```bash
cd /Users/VI2US/Documents/TradeMua && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Крок 3: Комміт**

```bash
git add src/components/products/ProductsFilters.tsx
git commit -m "feat: add ProductsFilters sidebar component with checkboxes and dual sliders"
```

---

## Task 6: `ProductsMobileDrawer`

**Files:**
- Create: `src/components/products/ProductsMobileDrawer.tsx`

- [ ] **Крок 1: Створити компонент**

```tsx
// src/components/products/ProductsMobileDrawer.tsx
"use client";
import { useEffect, type ReactNode } from "react";

interface ProductsMobileDrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function ProductsMobileDrawer({ open, onClose, children }: ProductsMobileDrawerProps) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Overlay */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Фільтри"
        className={`fixed inset-x-0 bottom-0 z-50 h-[85vh] rounded-t-2xl bg-card border-t border-[#2e2d2b] transition-transform duration-300 ease-out lg:hidden flex flex-col ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-[#2e2d2b]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#2e2d2b] shrink-0">
          <span className="font-headline-md text-[16px] text-on-surface">Фільтри</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрити фільтри"
            className="text-on-surface-variant hover:text-on-surface transition-colors p-1"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-5 pb-8">
          {children}
        </div>
      </div>
    </>
  );
}
```

- [ ] **Крок 2: Перевірити компіляцію**

```bash
cd /Users/VI2US/Documents/TradeMua && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Крок 3: Комміт**

```bash
git add src/components/products/ProductsMobileDrawer.tsx
git commit -m "feat: add ProductsMobileDrawer bottom sheet for mobile filters"
```

---

## Task 7: Рефакторинг `ProductsCatalog`

**Files:**
- Modify: `src/components/products/ProductsCatalog.tsx`

- [ ] **Крок 1: Повністю замінити вміст файлу**

```tsx
// src/components/products/ProductsCatalog.tsx
"use client";
import { useState } from "react";
import type { Product } from "@/lib/sheets";
import { useProductFilters, type SortOption } from "@/hooks/useProductFilters";
import { ProductCard } from "./ProductCard";
import { ProductsFilters } from "./ProductsFilters";
import { ProductsMobileDrawer } from "./ProductsMobileDrawer";

const SORT_LABELS: Record<SortOption, string> = {
  price_desc: "Ціна: спадання",
  price_asc:  "Ціна: зростання",
  power_asc:  "Потужність ↑",
  power_desc: "Потужність ↓",
  new_first:  "Новинки першими",
};

export default function ProductsCatalog({ products }: { products: Product[] }) {
  const { filters, setters, filtered, facets, globalRanges, activeCount, resetAll } =
    useProductFilters(products);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

      <div className="flex gap-8 items-start">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
          <ProductsFilters
            filters={filters}
            setters={setters}
            facets={facets}
            globalRanges={globalRanges}
            activeCount={activeCount}
            resetAll={resetAll}
          />
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Top bar: search + filters button (mobile) + sort */}
          <div className="flex gap-3 mb-6 flex-wrap">
            <div className="relative flex-1 min-w-0">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                search
              </span>
              <input
                type="text"
                placeholder="Пошук моделі..."
                value={filters.search}
                onChange={e => setters.setSearch(e.target.value)}
                className="w-full bg-card border border-[#2e2d2b] rounded pl-9 pr-4 py-2.5 font-technical-data text-technical-data text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/60 transition-colors"
              />
            </div>

            {/* Mobile filter button */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className={`lg:hidden px-4 py-2.5 rounded border font-label-caps text-label-caps uppercase tracking-widest text-xs transition-colors whitespace-nowrap ${
                activeCount > 0
                  ? "border-primary text-primary bg-primary/10"
                  : "border-[#2e2d2b] text-on-surface-variant hover:border-primary/50"
              }`}
            >
              <span className="material-symbols-outlined text-[14px] mr-1 align-middle">tune</span>
              Фільтри{activeCount > 0 ? ` (${activeCount})` : ""}
            </button>

            {/* Sort */}
            <select
              value={filters.sortBy}
              onChange={e => setters.setSortBy(e.target.value as SortOption)}
              className="catalog-sort bg-card border border-[#2e2d2b] rounded px-3 py-2.5 font-technical-data text-technical-data text-on-surface-variant focus:outline-none focus:border-primary/60 transition-colors cursor-pointer"
            >
              {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Count */}
          <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest mb-6">
            {filtered.length} моделей
          </p>

          {/* Grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-gutter">
              {filtered.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-24 gap-4 text-on-surface-variant">
              <span className="material-symbols-outlined text-[48px]">search_off</span>
              <p className="font-body-md text-body-md">Нічого не знайдено. Спробуйте інший запит.</p>
              <button
                type="button"
                onClick={resetAll}
                className="btn-ghost px-6 py-2 rounded font-label-caps text-label-caps uppercase tracking-widest text-xs"
              >
                Скинути фільтри
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile drawer */}
      <ProductsMobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <ProductsFilters
          filters={filters}
          setters={setters}
          facets={facets}
          globalRanges={globalRanges}
          activeCount={activeCount}
          resetAll={resetAll}
        />
      </ProductsMobileDrawer>
    </>
  );
}
```

- [ ] **Крок 2: Перевірити компіляцію**

```bash
cd /Users/VI2US/Documents/TradeMua && npx tsc --noEmit 2>&1 | head -30
```

Очікується: 0 помилок.

- [ ] **Крок 3: Запустити dev-сервер і перевірити в браузері**

```bash
cd /Users/VI2US/Documents/TradeMua && npm run dev
```

Відкрити `http://localhost:3000/products` і перевірити:
- [ ] Сайдбар видно на desktop (≥1024px) зліва
- [ ] Чекбокси "Виробник", "Алгоритм", "Монети", "Охолодження" відображаються з лічильниками
- [ ] Dual-слайдери ціни та потужності рухаються, значення оновлюються
- [ ] Вибір чекбокса фільтрує сітку
- [ ] Кнопка "Скинути все" з'являється при активних фільтрах і скидає все
- [ ] Сортування дропдаун змінює порядок карток
- [ ] На мобільному (<1024px) кнопка "Фільтри" видна, тап відкриває drawer
- [ ] Drawer закривається кліком на overlay або кнопку ✕
- [ ] При активних фільтрах кнопка "Фільтри (N)" показує кількість
- [ ] Empty state "Нічого не знайдено" з'являється при нульових результатах

- [ ] **Крок 4: Комміт**

```bash
git add src/components/products/ProductsCatalog.tsx
git commit -m "feat: refactor ProductsCatalog — sidebar filters, mobile drawer, sorting"
```

---

## Підсумок

Після всіх тасків:
- `src/lib/product-filters-meta.ts` — маппінги (Task 1)
- `src/hooks/useProductFilters.ts` — хук (Task 2)
- `src/components/products/ProductCard.tsx` — картка (Task 3)
- `src/app/globals.css` — dual slider CSS (Task 4)
- `src/components/products/ProductsFilters.tsx` — панель фільтрів (Task 5)
- `src/components/products/ProductsMobileDrawer.tsx` — mobile drawer (Task 6)
- `src/components/products/ProductsCatalog.tsx` — оркестратор (Task 7)
