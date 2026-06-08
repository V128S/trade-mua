// Ukrainian mobile phone formatting for the checkout field.
// Canonical display: "+380 XX XXX XX XX" (a locked +380 prefix + 9 national digits).

const PREFIX = '+380'

// Extract up to 9 national digits from arbitrary user input, dropping a leading
// country code (380) or trunk zero so paste/typing all normalise to the same 9.
export function nationalDigits(raw: string): string {
  let d = raw.replace(/\D/g, '')
  if (d.startsWith('380')) d = d.slice(3)
  if (d.startsWith('0')) d = d.slice(1)
  return d.slice(0, 9)
}

// Format any input into "+380 XX XXX XX XX". Returns "+380 " (prefix visible)
// while empty so the field never loses its prefix as the user edits.
export function formatUaPhone(raw: string): string {
  const d = nationalDigits(raw)
  const groups = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean)
  const tail = groups.join(' ')
  return tail ? `${PREFIX} ${tail}` : `${PREFIX} `
}

// A complete UA mobile number has exactly 9 national digits.
export function isCompleteUaPhone(raw: string): boolean {
  return nationalDigits(raw).length === 9
}
