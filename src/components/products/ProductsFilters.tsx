// src/components/products/ProductsFilters.tsx
"use client";
import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { FilterState, FilterSetters, Facets, GlobalRanges } from "@/hooks/useProductFilters";

interface ProductsFiltersProps {
  filters: FilterState;
  setters: FilterSetters;
  facets: Facets;
  globalRanges: GlobalRanges;
  activeCount: number;
  resetAll: () => void;
  hideHeader?: boolean;
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
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#2e2d2b] py-3">
      <button
        type="button"
        aria-expanded={open}
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
  labels,
}: {
  min: number;
  max: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
  format: (v: number) => string;
  labels: [string, string];
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
          style={{ zIndex: value[0] >= (min + max) / 2 ? 5 : 3 }}
          aria-label={labels[0]}
          aria-valuetext={format(value[0])}
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
          style={{ zIndex: value[1] <= (min + max) / 2 ? 5 : 3 }}
          aria-label={labels[1]}
          aria-valuetext={format(value[1])}
        />
      </div>
    </div>
  );
}

export function ProductsFilters({
  filters, setters, facets, globalRanges, activeCount, resetAll, hideHeader = false,
}: ProductsFiltersProps) {
  const t = useTranslations("products");

  return (
    <div>
      {/* Header — hidden inside mobile drawer which has its own header */}
      {!hideHeader && (
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#2e2d2b]">
        <span className="font-label-caps text-label-caps text-on-surface uppercase tracking-widest text-[11px]">
          {t("filtersPanelTitle")}
        </span>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={resetAll}
            className="btn-ghost px-2 py-1 rounded font-label-caps text-[10px] uppercase tracking-widest"
          >
            {t("filtersResetAll")}
          </button>
        )}
      </div>
      )}

      {/* In stock */}
      <div className="border-b border-[#2e2d2b] py-3 mb-0">
        <CustomCheckbox
          checked={filters.stockOnly}
          onChange={() => setters.setStockOnly(!filters.stockOnly)}
          label={t("filterInStock")}
        />
      </div>

      {/* Brand */}
      {Object.keys(facets.brands).length > 0 && (
        <FilterSection title={t("filterBrand")}>
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

      {/* Algorithm */}
      {Object.keys(facets.algorithms).length > 0 && (
        <FilterSection title={t("filterAlgorithm")}>
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

      {/* Coins */}
      {Object.keys(facets.coins).length > 0 && (
        <FilterSection title={t("filterCoins")}>
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

      {/* Cooling */}
      {Object.keys(facets.coolingTypes).length > 0 && (
        <FilterSection title={t("filterCooling")}>
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

      {/* Price */}
      <FilterSection title={t("filterPrice")}>
        <DualRangeSlider
          min={globalRanges.price[0]}
          max={globalRanges.price[1]}
          value={filters.priceRange}
          onChange={setters.setPriceRange}
          format={v => `$${v.toLocaleString("uk-UA")}`}
          labels={[t("filterPriceMin"), t("filterPriceMax")]}
        />
      </FilterSection>

      {/* Power */}
      <FilterSection title={t("filterPower")}>
        <DualRangeSlider
          min={globalRanges.power[0]}
          max={globalRanges.power[1]}
          value={filters.powerRange}
          onChange={setters.setPowerRange}
          format={v => `${v.toLocaleString("uk-UA")} W`}
          labels={[t("filterPowerMin"), t("filterPowerMax")]}
        />
      </FilterSection>
    </div>
  );
}
