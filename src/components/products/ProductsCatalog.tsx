// src/components/products/ProductsCatalog.tsx
"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Product } from "@/lib/sheets";
import { useProductFilters, type SortOption } from "@/hooks/useProductFilters";
import { ProductCard } from "./ProductCard";
import { ProductsFilters } from "./ProductsFilters";
import { ProductsMobileDrawer } from "./ProductsMobileDrawer";

const PAGE_SIZE = 9; // 3-column grid → load 3 full rows at a time

export default function ProductsCatalog({
  products,
  revenueByAlgo = {},
}: {
  products: Product[];
  revenueByAlgo?: Record<string, number>;
}) {
  const t = useTranslations("products");

  const SORT_LABELS: Record<SortOption, string> = {
    price_desc: t("sortPriceDesc"),
    price_asc:  t("sortPriceAsc"),
    power_asc:  t("sortPowerAsc"),
    power_desc: t("sortPowerDesc"),
    new_first:  t("sortNewFirst"),
  };

  const { filters, setters, filtered, facets, globalRanges, activeCount, resetAll } =
    useProductFilters(products);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);

  // Reset pagination when the filtered set changes (filters/search/sort).
  // `filtered` is memoized, so this only fires on an actual change — the
  // React-recommended "adjust state during render" pattern instead of an effect.
  const [prevFiltered, setPrevFiltered] = useState(filtered);
  if (filtered !== prevFiltered) {
    setPrevFiltered(filtered);
    setPage(1);
  }

  const visibleProducts = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visibleProducts.length < filtered.length;
  const remaining = filtered.length - visibleProducts.length;
  const loadCount = Math.min(remaining, PAGE_SIZE);

  return (
    <>
      {/* Page header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="h-px bg-outline-variant flex-1" />
        <h1 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest whitespace-nowrap">
          {t("catalogHeading")}
        </h1>
        <div className="h-px bg-outline-variant flex-1" />
      </div>

      <div className="flex gap-8 items-start">
        {/* Desktop sidebar */}
        <aside className="catalog-scroll hidden lg:block w-64 shrink-0 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-3">
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
                placeholder={t("searchPlaceholder")}
                value={filters.search}
                onChange={e => setters.setSearch(e.target.value)}
                className="w-full bg-card border border-card-border rounded pl-9 pr-4 py-2.5 font-technical-data text-technical-data text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/60 transition-colors"
              />
            </div>

            {/* Mobile filter button */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className={`lg:hidden px-4 py-2.5 rounded border font-label-caps text-label-caps uppercase tracking-widest text-xs transition-colors whitespace-nowrap ${
                activeCount > 0
                  ? "border-primary text-primary bg-primary/10"
                  : "border-card-border text-on-surface-variant hover:border-primary/50"
              }`}
            >
              <span className="material-symbols-outlined text-[14px] mr-1 align-middle">tune</span>
              {t("filtersButton")}{activeCount > 0 ? ` (${activeCount})` : ""}
            </button>

            {/* Sort */}
            <select
              value={filters.sortBy}
              onChange={e => setters.setSortBy(e.target.value as SortOption)}
              className="catalog-sort bg-card border border-card-border rounded px-3 py-2.5 font-technical-data text-technical-data text-on-surface-variant focus:outline-none focus:border-primary/60 transition-colors cursor-pointer"
            >
              {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Count */}
          <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest mb-6">
            {t("shownCount", { shown: visibleProducts.length, total: filtered.length })}
          </p>

          {/* Grid */}
          {filtered.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-gutter">
                {visibleProducts.map(p => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    revenuePerTH={revenueByAlgo[p.algorithm] ?? 0}
                  />
                ))}
              </div>
              {hasMore && (
                <div className="flex justify-center mt-8">
                  <button
                    type="button"
                    onClick={() => setPage(p => p + 1)}
                    aria-label={t("loadMoreAria", { count: loadCount })}
                    className="btn-ghost px-8 py-3 rounded font-label-caps text-label-caps uppercase tracking-widest text-xs"
                  >
                    <span className="material-symbols-outlined text-[14px] mr-2 align-middle">expand_more</span>
                    {t("loadMore", { count: loadCount })}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center py-24 gap-4 text-on-surface-variant">
              <span className="material-symbols-outlined text-[48px]">search_off</span>
              <p className="font-body-md text-body-md">{t("emptyState")}</p>
              <button
                type="button"
                onClick={resetAll}
                className="btn-ghost px-6 py-2 rounded font-label-caps text-label-caps uppercase tracking-widest text-xs"
              >
                {t("resetFilters")}
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
          hideHeader
        />
      </ProductsMobileDrawer>
    </>
  );
}
