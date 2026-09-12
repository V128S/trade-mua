import { describe, it, expect } from 'vitest'
import { getFamilySlug } from './sheets'

describe('getFamilySlug', () => {
  it('builds a stable slug from brand + name + hashrate', () => {
    expect(getFamilySlug({ brand: 'AntMiner', name: 'AntMiner Z15K', hashrate: '525 KH/s' }))
      .toBe('ant-z15k-525kh')
  })

  it('produces the same slug for batch siblings (same name+hashrate)', () => {
    const a = getFamilySlug({ brand: 'AntMiner', name: 'AntMiner Z15K', hashrate: '525 KH/s' })
    const b = getFamilySlug({ brand: 'AntMiner', name: 'AntMiner Z15K', hashrate: '525 KH/s' })
    expect(a).toBe(b)
  })

  it('differs when the hashrate differs', () => {
    const a = getFamilySlug({ brand: 'AntMiner', name: 'AntMiner Z15 Pro', hashrate: '840 KH/s' })
    const b = getFamilySlug({ brand: 'AntMiner', name: 'AntMiner Z15 Pro', hashrate: '900 KH/s' })
    expect(a).not.toBe(b)
  })

  it('falls back to a 4-letter brand slug when the firm is not in BRAND_MAP', () => {
    expect(getFamilySlug({ brand: 'Canaan', name: 'Canaan Avalon X', hashrate: '100 TH/s' }))
      .toBe('cana-avalon-x-100th')
  })
})
