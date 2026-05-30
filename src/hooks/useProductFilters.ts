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
