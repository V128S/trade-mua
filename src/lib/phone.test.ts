import { describe, it, expect } from 'vitest'
import { formatUaPhone, isCompleteUaPhone, nationalDigits } from './phone'

describe('nationalDigits', () => {
  it('keeps a bare 9-digit national number', () => {
    expect(nationalDigits('671234567')).toBe('671234567')
  })
  it('drops a leading trunk zero', () => {
    expect(nationalDigits('0671234567')).toBe('671234567')
  })
  it('drops a leading 380 country code', () => {
    expect(nationalDigits('+380671234567')).toBe('671234567')
  })
  it('strips formatting characters', () => {
    expect(nationalDigits('+380 (67) 123-45-67')).toBe('671234567')
  })
  it('caps at 9 digits', () => {
    expect(nationalDigits('6712345678888')).toBe('671234567')
  })
  it('returns empty for no digits', () => {
    expect(nationalDigits('+380 ')).toBe('')
  })
})

describe('formatUaPhone', () => {
  it('formats a full number as +380 XX XXX XX XX', () => {
    expect(formatUaPhone('671234567')).toBe('+380 67 123 45 67')
  })
  it('formats the same regardless of leading 0 or +380', () => {
    expect(formatUaPhone('0671234567')).toBe('+380 67 123 45 67')
    expect(formatUaPhone('+380671234567')).toBe('+380 67 123 45 67')
  })
  it('keeps the prefix visible while empty', () => {
    expect(formatUaPhone('')).toBe('+380 ')
    expect(formatUaPhone('+380')).toBe('+380 ')
  })
  it('groups a partial number progressively', () => {
    expect(formatUaPhone('67')).toBe('+380 67')
    expect(formatUaPhone('67123')).toBe('+380 67 123')
    expect(formatUaPhone('6712345')).toBe('+380 67 123 45')
  })
})

describe('isCompleteUaPhone', () => {
  it('is true for exactly 9 national digits', () => {
    expect(isCompleteUaPhone('+380 67 123 45 67')).toBe(true)
  })
  it('is false for a short number', () => {
    expect(isCompleteUaPhone('+380 67 123')).toBe(false)
  })
  it('is false for just the prefix', () => {
    expect(isCompleteUaPhone('+380 ')).toBe(false)
  })
})
