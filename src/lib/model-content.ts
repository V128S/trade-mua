// Curated per-model SEO content layer for top Antminer families.
//
// Products are synced from a Google Sheet and have no editorial description
// field, so we attach hand-written copy (description + FAQ, localized) by
// matching the product name to a model family. Each key maps to message keys
// `model<Key>Body` and `model<Key>Faq{1..3}{Q,A}` in the `products` namespace.
//
// Matching is plain case-insensitive substring on the (Antminer-only) name,
// so every variant of a family (S21, S21 Pro, S21 XP, S21+ Hydro, …) shares the
// same family copy. Order is most-specific-first for safety.

const MODEL_MATCHERS: Array<{ token: string; key: string }> = [
  { token: "z15", key: "Z15" },
  { token: "ks7", key: "KS7" },
  { token: "l9", key: "L9" },
  { token: "l7", key: "L7" },
  { token: "s23", key: "S23" },
  { token: "s21", key: "S21" },
  { token: "s19", key: "S19" },
];

/** Content key for a product name, or null when no curated copy exists. */
export function getModelContentKey(name: string): string | null {
  const n = name.toLowerCase();
  if (!n.includes("antminer")) return null; // copy is Antminer-specific
  for (const { token, key } of MODEL_MATCHERS) {
    if (n.includes(token)) return key;
  }
  return null;
}
