import { describe, it, expect } from 'vitest'
import { parseBatchFromModel, monthsFromNow, formatBatchLabel, collapseBatches } from './batch'

describe('parseBatchFromModel', () => {
  it('extracts a trailing month-abbreviation batch tag', () => {
    expect(parseBatchFromModel('Z15 Pro (Dec)')).toEqual({ model: 'Z15 Pro', batch: 'dec' })
  })

  it('is case-insensitive and normalizes batch to lowercase', () => {
    expect(parseBatchFromModel('Z15 Pro (DEC)')).toEqual({ model: 'Z15 Pro', batch: 'dec' })
    expect(parseBatchFromModel('Z15 Pro (dec)')).toEqual({ model: 'Z15 Pro', batch: 'dec' })
  })

  it('returns batch null when there is no parenthesized tag', () => {
    expect(parseBatchFromModel('Z15 Pro')).toEqual({ model: 'Z15 Pro', batch: null })
  })

  it('leaves non-month parenthesized suffixes untouched', () => {
    expect(parseBatchFromModel('S21 Hydro (2024)')).toEqual({ model: 'S21 Hydro (2024)', batch: null })
  })

  it('trims extra whitespace left after stripping the tag', () => {
    expect(parseBatchFromModel('Z15 Pro  (Dec)')).toEqual({ model: 'Z15 Pro', batch: 'dec' })
  })
})

describe('monthsFromNow', () => {
  it('is 0 for the current month', () => {
    expect(monthsFromNow('mar', new Date(2026, 2, 15))).toBe(0) // March = index 2
  })

  it('counts forward within the same year', () => {
    expect(monthsFromNow('jun', new Date(2026, 2, 15))).toBe(3) // March -> June
  })

  it('wraps across the year boundary', () => {
    expect(monthsFromNow('jan', new Date(2026, 11, 1))).toBe(1) // December -> January
  })

  it('treats a month just passed as eleven months out', () => {
    expect(monthsFromNow('dec', new Date(2027, 0, 15))).toBe(11) // January -> December
  })
})

describe('formatBatchLabel', () => {
  it('formats and capitalizes the month name per locale', () => {
    expect(formatBatchLabel('dec', 'uk')).toBe('Грудень')
    expect(formatBatchLabel('dec', 'en')).toBe('December')
    expect(formatBatchLabel('dec', 'ru')).toBe('Декабрь')
  })
})

describe('collapseBatches', () => {
  const row = (over: Partial<{ id: string; name: string; hashrate: string; batch: string | null; priceUSDT: number }>) => ({
    id: 'x', name: 'AntMiner Z15 Pro', hashrate: '840 KH/s', batch: null, priceUSDT: 100, ...over,
  })

  it('leaves a product with no batch siblings untouched', () => {
    const products = [row({ id: 'a' })]
    expect(collapseBatches(products, new Date(2026, 0, 1))).toEqual(products)
  })

  it('collapses same model+hashrate batch rows to the soonest one', () => {
    const products = [
      row({ id: 'dec', batch: 'dec', priceUSDT: 120 }),
      row({ id: 'jan', batch: 'jan', priceUSDT: 110 }),
      row({ id: 'feb', batch: 'feb', priceUSDT: 105 }),
    ]
    // "now" = December -> dec is the soonest upcoming batch
    const result = collapseBatches(products, new Date(2026, 11, 1))
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('dec')
  })

  it('does not collapse rows with different hashrate', () => {
    const products = [
      row({ id: 'a', batch: 'dec', hashrate: '840 KH/s' }),
      row({ id: 'b', batch: 'dec', hashrate: '525 KH/s' }),
    ]
    expect(collapseBatches(products, new Date(2026, 0, 1))).toHaveLength(2)
  })

  it('does not collapse rows with different model names', () => {
    const products = [
      row({ id: 'a', name: 'AntMiner Z15 Pro', batch: 'dec' }),
      row({ id: 'b', name: 'AntMiner Z15K', batch: 'dec' }),
    ]
    expect(collapseBatches(products, new Date(2026, 0, 1))).toHaveLength(2)
  })
})
