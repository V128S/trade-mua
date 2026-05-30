# Products Catalog — Фільтри з сайдбаром

**Дата:** 2026-05-30  
**Статус:** Затверджено

---

## Мета

Перетворити сторінку `/products` на повноцінний магазинний досвід: додати сайдбар з фільтрами зліва (desktop) та drawer знизу (mobile). Фільтри: виробник, алгоритм, монети, тип охолодження, діапазон ціни, діапазон потужності. Плюс сортування.

---

## Структура файлів

```
src/
  hooks/
    useProductFilters.ts            # увесь стан + логіка фільтрації
  lib/
    product-filters-meta.ts         # маппінги algo→coins, getCoolingType()
  components/products/
    ProductCard.tsx                 # витягнутий з ProductsCatalog
    ProductsFilters.tsx             # сайдбар (панель фільтрів)
    ProductsMobileDrawer.tsx        # drawer-обгортка для мобільного
    ProductsCatalog.tsx             # оркестратор (рефакторинг)
```

---

## Маппінги даних (`product-filters-meta.ts`)

### Монети з алгоритму

```ts
export const ALGO_COINS: Record<string, string[]> = {
  sha256:      ["BTC", "BCH"],
  scrypt:      ["LTC", "DOGE"],
  kheavyhash:  ["KAS"],
  randomx:     ["XMR"],
  versahash:   ["ALPH"],
  x11:         ["DASH"],
  equihash:    ["ZEC", "ZEN"],
  ethhash:     ["ETC"],
  handshake:   ["HNS"],
  eaglesong:   ["CKB"],
  blake2b:     ["SC"],
};
```

### Тип охолодження з назви моделі

```ts
export function getCoolingType(name: string): "Повітряне" | "Hydro" | "Immersive" {
  if (/hyd/i.test(name)) return "Hydro";
  if (/imm/i.test(name)) return "Immersive";
  return "Повітряне";
}
```

---

## Хук `useProductFilters`

### Стан

```ts
interface FilterState {
  search: string;
  stockOnly: boolean;
  brands: string[];
  algorithms: string[];
  coins: string[];
  coolingTypes: string[];
  priceRange: [number, number];   // [min, max] — в межах глобального діапазону
  powerRange: [number, number];
  sortBy: SortOption;
}

type SortOption =
  | "price_desc"    // дефолт
  | "price_asc"
  | "power_asc"
  | "power_desc"
  | "new_first";
```

### Повертає

```ts
{
  filters: FilterState,
  setters: {
    setSearch, setStockOnly,
    toggleBrand, toggleAlgorithm, toggleCoin, toggleCooling,
    setPriceRange, setPowerRange,
    setSortBy,
  },
  filtered: Product[],      // результат після всіх фільтрів + сортування
  facets: Facets,           // лічильники для кожного чекбокса
  globalRanges: { price: [min,max], power: [min,max] },  // незмінні межі слайдерів
  activeCount: number,      // кількість активних фільтрів (для мобільної кнопки)
  resetAll: () => void,
}
```

### Логіка фільтрації (AND між групами, OR всередині)

```
products
  → search:      name або algo містить рядок (case-insensitive)
  → stockOnly:   inStock === true
  → brands:      [] = ігнор; інакше brand ∈ brands
  → algorithms:  [] = ігнор; інакше algorithm ∈ algorithms
  → coins:       [] = ігнор; інакше перетин(ALGO_COINS[algo], coins) не порожній
  → cooling:     [] = ігнор; інакше getCoolingType(name) ∈ coolingTypes
  → price:       priceUSDT ∈ [min, max]
  → power:       powerW ∈ [min, max]
  → sort:        застосувати sortBy
```

### Facets

Рахуються без урахування власної групи (partial filtering):

- Для `brands`: фільтруємо все, крім `brands` → рахуємо скільки товарів кожного бренду проходять.
- Аналогічно для `algorithms`, `coins`, `coolingTypes`.

Це дає поведінку як Rozetka/Amazon — вибравши один бренд, бачиш скільки товарів є в інших.

### Лічильник активних фільтрів

```ts
activeCount =
  brands.length +
  algorithms.length +
  coins.length +
  coolingTypes.length +
  (priceRange[0] > globalRanges.price[0] || priceRange[1] < globalRanges.price[1] ? 1 : 0) +
  (powerRange[0] > globalRanges.power[0] || powerRange[1] < globalRanges.power[1] ? 1 : 0) +
  (stockOnly ? 1 : 0)
```

---

## Компоненти

### `ProductCard.tsx`

Витягнути існуючий `ProductCard` з `ProductsCatalog.tsx` без змін. Окремий файл.

### `ProductsFilters.tsx`

Props: `{ facets, filters, setters, globalRanges, onClose? }`

Структура:
```
<aside>
  [Заголовок "ФІЛЬТРИ" + кнопка "Скинути все" якщо activeCount > 0]

  [Секція "Виробник"]     — чекбокси + лічильники
  [Секція "Алгоритм"]     — чекбокси + лічильники
  [Секція "Монети"]       — чекбокси + лічильники
  [Секція "Охолодження"]  — чекбокси + лічильники
  [Секція "Ціна $"]       — range-слайдер dual
  [Секція "Потужність W"] — range-слайдер dual
</aside>
```

Кожна секція — акордеон (відкрита за замовчуванням, можна згорнути). Кастомний чекбокс 14×14px: рамка `border-card`, при active — заповнений `bg-primary`, галочка `text-[#0e0e0a]`.

### Range-слайдер (dual)

Реалізація через два нативних `<input type="range">` з CSS `appearance: none`. Трек між повзунками заповнюється `primary` через CSS custom properties. Без зовнішніх бібліотек.

Відображає поточні значення: `$2 000 — $15 000` або `1 200 W — 6 000 W`.

### `ProductsMobileDrawer.tsx`

- `fixed inset-x-0 bottom-0 z-50`
- `h-[85vh]`, `rounded-t-2xl bg-card border-t border-card`
- Overlay: `fixed inset-0 bg-black/60 z-40`
- Анімація: `translate-y-0` / `translate-y-full` через CSS transition
- Всередині: заголовок + `<ProductsFilters onClose={close} />`
- Закривається: overlay клік, свайп вниз (простий drag detection), кнопка ✕

### `ProductsCatalog.tsx` (рефакторинг)

```tsx
export default function ProductsCatalog({ products }) {
  const { filters, setters, filtered, facets, globalRanges, activeCount, resetAll }
    = useProductFilters(products);

  return (
    <div className="flex gap-8">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <ProductsFilters ... />
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Top bar: search + sort */}
        {/* Mobile filters button */}
        {/* Count */}
        {/* Grid: grid-cols-2 xl:grid-cols-3 */}
      </div>
    </div>

    {/* Mobile drawer */}
    <ProductsMobileDrawer open={drawerOpen} onClose={...}>
      <ProductsFilters ... />
    </ProductsMobileDrawer>
  );
}
```

---

## Макет

### Desktop (≥1024px)

- Flex row: сайдбар `w-64 shrink-0` + контент `flex-1`
- Сайдбар: `sticky top-24`, прокрутка при переповненні
- Сітка: `grid-cols-2 xl:grid-cols-3`

### Mobile (<1024px)

- Сайдбар прихований
- Рядок над сіткою: `[search] [Фільтри (N)] [сортування]`
- Кнопка "Фільтри (N)" відкриває drawer
- Сітка: `grid-cols-1 sm:grid-cols-2`

---

## Стиль (темна тема)

- Сайдбар фон: `bg-[#141410]` (page background, зливається зі сторінкою)
- Роздільники секцій: `border-b border-[#2e2d2b]`
- Чекбокс активний: `bg-primary` (#ecc246) + dark checkmark
- Слайдер трек active: `background: #ecc246`
- Drawer: `bg-card` (#1a1918)
- Лічильник поряд з назвою чекбокса: `text-on-surface-variant` (приглушений)
- Кнопка "Скинути": `btn-ghost` малий

---

## Що не входить у цей PR

- Зміни схеми БД (немає нових полів — coins і cooling виводяться в runtime)
- URL-параметри для фільтрів
- Серверна фільтрація через Supabase (все на клієнті)
