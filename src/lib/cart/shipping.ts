// Best-effort split of a stored full name into first/last for prefilling the
// checkout form. Splits on the first whitespace: text before it is the first
// name, the trimmed remainder is the last name.
export function splitFullName(fullName: string): { first: string; last: string } {
  const trimmed = fullName.trim()
  if (!trimmed) return { first: '', last: '' }
  const idx = trimmed.search(/\s/)
  if (idx === -1) return { first: trimmed, last: '' }
  return { first: trimmed.slice(0, idx), last: trimmed.slice(idx + 1).trim() }
}

// Compose the legacy single-line Nova Poshta address from the structured city +
// branch fields, so old admin views and existing orders stay consistent.
export function composeShippingAddress(city: string, branch: string): string {
  return [city.trim(), branch.trim()].filter(Boolean).join(', ')
}
