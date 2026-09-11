// Supply-batch parsing: a model name can carry a trailing delivery-batch tag,
// e.g. "Z15 Pro (Dec)" — same hashrate/specs, different price per shipment
// month. Stripped from the display name, surfaced as its own selector.

export const MONTH_ABBRS = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
] as const;

export type BatchMonth = (typeof MONTH_ABBRS)[number];

const MONTH_SET: Set<string> = new Set(MONTH_ABBRS);

function isBatchMonth(s: string): s is BatchMonth {
  return MONTH_SET.has(s);
}

// "Z15 Pro (Dec)" -> { model: "Z15 Pro", batch: "dec" }
// "Z15 Pro"       -> { model: "Z15 Pro", batch: null }
// A parenthesized suffix that isn't a recognized month abbreviation (e.g.
// "(2024)") is left as part of the model — only real batch tags are parsed.
export function parseBatchFromModel(model: string): { model: string; batch: BatchMonth | null } {
  const match = model.match(/^(.*?)\s*\(([A-Za-z]{3})\)\s*$/);
  if (match) {
    const tag = match[2].toLowerCase();
    if (isBatchMonth(tag)) {
      return { model: match[1].trim(), batch: tag };
    }
  }
  return { model, batch: null };
}

// Calendar-month distance from `now` forward to the next occurrence of
// `batch` (0 = this month, 11 = eleven months from now). Used to sort batch
// options and pick the soonest one as the catalog representative.
export function monthsFromNow(batch: BatchMonth, now: Date = new Date()): number {
  const target = MONTH_ABBRS.indexOf(batch);
  const current = now.getMonth();
  return (target - current + 12) % 12;
}

// Localized, capitalized month name for a batch tag — leans on Intl so
// uk/en/ru all come from real ICU data instead of hand-maintained copy.
export function formatBatchLabel(batch: BatchMonth, locale: string): string {
  const index = MONTH_ABBRS.indexOf(batch);
  const name = new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2024, index, 1));
  return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1);
}

interface BatchGroupable {
  id: string;
  name: string;
  hashrate: string;
  batch: string | null;
  priceUSDT: number;
}

// Collapses rows that share the same model name + hashrate and differ only
// by delivery batch into a single representative — the soonest upcoming
// batch (ties broken by lowest price). Rows without batch siblings pass
// through untouched. Used for the /products catalog grid; the product
// detail page still lists every batch via its own selector.
export function collapseBatches<T extends BatchGroupable>(products: T[], now: Date = new Date()): T[] {
  const groups = new Map<string, T[]>();
  for (const p of products) {
    const key = `${p.name}::${p.hashrate}`;
    const group = groups.get(key);
    if (group) group.push(p);
    else groups.set(key, [p]);
  }

  const result: T[] = [];
  for (const group of groups.values()) {
    if (group.length === 1) {
      result.push(group[0]);
      continue;
    }
    const [soonest] = [...group].sort((a, b) => {
      const da = a.batch && isBatchMonth(a.batch) ? monthsFromNow(a.batch, now) : Infinity;
      const db = b.batch && isBatchMonth(b.batch) ? monthsFromNow(b.batch, now) : Infinity;
      if (da !== db) return da - db;
      return a.priceUSDT - b.priceUSDT;
    });
    result.push(soonest);
  }
  return result;
}
