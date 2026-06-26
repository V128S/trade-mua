import { describe, it, expect } from 'vitest'
import { computeStaleIds } from './sync'

describe('computeStaleIds', () => {
  it('returns existing ids that are no longer current', () => {
    expect(computeStaleIds(['a', 'b'], ['a', 'b', 'c', 'd'])).toEqual(['c', 'd'])
  })
  it('returns [] when every existing id is still current', () => {
    expect(computeStaleIds(['a', 'b'], ['a', 'b'])).toEqual([])
  })
  it('does not mistake reserved-char SKU ids for filter syntax', () => {
    const ids = ['ant-s21,pro', 'avl-a15(2024)']
    expect(computeStaleIds(ids, [...ids, 'old-sku'])).toEqual(['old-sku'])
  })
})
