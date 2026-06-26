import { describe, it, expect } from 'vitest'
import { SITE_URL } from './site'

describe('SITE_URL', () => {
  it('is the canonical UA origin with no trailing slash', () => {
    expect(SITE_URL).toBe('https://традем.com.ua')
    expect(SITE_URL.endsWith('/')).toBe(false)
  })
})
