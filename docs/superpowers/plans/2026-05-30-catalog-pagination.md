# Catalog Pagination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add client-side "Load more" pagination (10 items/page) with a visible counter to the ASIC product catalog.

**Architecture:** All filtering/sorting already happens client-side in `useProductFilters`. We slice the resulting `filtered` array by `page * PAGE_SIZE` to get `visibleProducts`. A `page` state lives in `ProductsCatalog` and resets to 1 whenever `filtered` changes (i.e. on any filter/sort action). No new files, no changes to `useProductFilters`.

**Tech Stack:** React `useState` + `useEffect`, TypeScript, Tailwind CSS / existing dark design-system classes.

---

### Task 1: Add pagination state and visible-products slice

**Files:**
- Modify: `src/components/products/ProductsCatalog.tsx`

- [ ] **Step 1: Add `PAGE_SIZE` constant and `page` state**

  In `ProductsCatalog.tsx`, after the existing `useState(false)` for `drawerOpen`, add:

  ```tsx
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  ```

- [ ] **Step 2: Reset `page` to 1 whenever `filtered` changes**

  Add `useEffect` import to the existing React import line (it already imports `useState`), then add after the state declarations:

  ```tsx
  useEffect(() => {
    setPage(1);
  }, [filtered]);
  ```

  The import line becomes:
  ```tsx
  import { useState, useEffect } from "react";
  ```

- [ ] **Step 3: Compute `visibleProducts`**

  Directly after the `useEffect`, add:

  ```tsx
  const visibleProducts = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visibleProducts.length < filtered.length;
  const remaining = filtered.length - visibleProducts.length;
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add src/components/products/ProductsCatalog.tsx
  git commit -m "feat(catalog): add page state and visibleProducts slice"
  ```

---

### Task 2: Update the counter label and grid rendering

**Files:**
- Modify: `src/components/products/ProductsCatalog.tsx`

- [ ] **Step 1: Replace the counter paragraph**

  Find (line ~91–93):
  ```tsx
  <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest mb-6">
    {filtered.length} моделей
  </p>
  ```

  Replace with:
  ```tsx
  <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest mb-6">
    Показано {visibleProducts.length} з {filtered.length}
  </p>
  ```

- [ ] **Step 2: Render `visibleProducts` in the grid instead of `filtered`**

  Find (line ~97–99):
  ```tsx
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-gutter">
    {filtered.map(p => (
      <ProductCard key={p.id} product={p} />
  ```

  Replace `filtered.map` with `visibleProducts.map`:
  ```tsx
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-gutter">
    {visibleProducts.map(p => (
      <ProductCard key={p.id} product={p} />
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/components/products/ProductsCatalog.tsx
  git commit -m "feat(catalog): show visibleProducts slice in grid with updated counter"
  ```

---

### Task 3: Add "Показати ще" button below the grid

**Files:**
- Modify: `src/components/products/ProductsCatalog.tsx`

- [ ] **Step 1: Add the button after the grid closing tag**

  The grid block ends with `</div>` after the last `ProductCard`. Directly after that closing `</div>` (still inside the outer `{filtered.length > 0 ? (` branch), add:

  ```tsx
  {hasMore && (
    <div className="flex justify-center mt-8">
      <button
        type="button"
        onClick={() => setPage(p => p + 1)}
        className="btn-ghost px-8 py-3 rounded font-label-caps text-label-caps uppercase tracking-widest text-xs"
      >
        <span className="material-symbols-outlined text-[14px] mr-2 align-middle">expand_more</span>
        Показати ще {Math.min(remaining, PAGE_SIZE)}
      </button>
    </div>
  )}
  ```

  The full positive branch now looks like:
  ```tsx
  {filtered.length > 0 ? (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-gutter">
        {visibleProducts.map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {hasMore && (
        <div className="flex justify-center mt-8">
          <button
            type="button"
            onClick={() => setPage(p => p + 1)}
            className="btn-ghost px-8 py-3 rounded font-label-caps text-label-caps uppercase tracking-widest text-xs"
          >
            <span className="material-symbols-outlined text-[14px] mr-2 align-middle">expand_more</span>
            Показати ще {Math.min(remaining, PAGE_SIZE)}
          </button>
        </div>
      )}
    </>
  ) : (
  ```

  Note: wrapping the two siblings in a `<>…</>` fragment is required since JSX ternary arms must be single elements.

- [ ] **Step 2: Verify TypeScript compiles**

  ```bash
  npx tsc --noEmit
  ```

  Expected: no errors.

- [ ] **Step 3: Manual smoke test**

  Start dev server (`npm run dev`), open `/products`.
  - Confirm only 10 products render on load.
  - Counter reads "Показано 10 з N".
  - "Показати ще 10" button is visible.
  - Click button → 10 more items appear, counter updates, scroll stays in place.
  - When fewer than 10 remain, button shows "Показати ще X" with the exact remainder.
  - When all shown, button disappears.
  - Apply any filter → list resets to 10 items, counter resets.

- [ ] **Step 4: Commit**

  ```bash
  git add src/components/products/ProductsCatalog.tsx
  git commit -m "feat(catalog): add load-more pagination with counter"
  ```
