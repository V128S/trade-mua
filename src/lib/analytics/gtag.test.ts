import { afterEach, describe, expect, it, vi } from 'vitest'
import { gtagEvent } from './gtag'

// vitest env is `node`, so there is no `window`. We attach/detach a fake one
// on globalThis to exercise both the guarded no-op path and the forward path.
afterEach(() => {
  delete (globalThis as { window?: unknown }).window
})

describe('gtagEvent', () => {
  it('is a no-op (does not throw) when window is absent', () => {
    expect(() => gtagEvent('view_item', { value: 1 })).not.toThrow()
  })

  it('forwards to window.gtag with the GA event signature', () => {
    const spy = vi.fn()
    ;(globalThis as { window?: unknown }).window = { gtag: spy }
    gtagEvent('add_to_cart', { value: 10 })
    expect(spy).toHaveBeenCalledWith('event', 'add_to_cart', { value: 10 })
  })

  it('swallows errors thrown by gtag', () => {
    ;(globalThis as { window?: unknown }).window = {
      gtag: () => {
        throw new Error('boom')
      },
    }
    expect(() => gtagEvent('purchase', {})).not.toThrow()
  })
})
