// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import AnimatedPrice from './AnimatedPrice'

function mockMatchMedia(reducedMotion: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reducedMotion && query.includes('prefers-reduced-motion'),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('AnimatedPrice', () => {
  beforeEach(() => {
    mockMatchMedia(false)
    // Default: invoke the rAF callback synchronously with the real clock —
    // real animation frames don't matter here, only that the component's own
    // convergence logic (t reaching 1) is exercised deterministically.
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(performance.now())
      return 0
    })
  })

  it('renders the initial value formatted as currency', () => {
    render(<AnimatedPrice value={1000} />)
    expect(screen.getByText('$1,000')).toBeTruthy()
  })

  it('snaps to the new value immediately when reduced motion is preferred', () => {
    mockMatchMedia(true)
    const { rerender } = render(<AnimatedPrice value={1000} />)
    rerender(<AnimatedPrice value={2500} />)
    expect(screen.getByText('$2,500')).toBeTruthy()
  })

  it('converges to the new value once the animation completes', () => {
    // Fast-forward the rAF callback by 1s so the tween's easing curve
    // resolves to t>=1 on the first frame — tests convergence, not the
    // frame-by-frame animation itself.
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(performance.now() + 1000)
      return 0
    })
    const { rerender } = render(<AnimatedPrice value={1000} />)
    rerender(<AnimatedPrice value={1500} />)
    expect(screen.getByText('$1,500')).toBeTruthy()
  })

  it('does not change display when the value prop is unchanged', () => {
    const { rerender } = render(<AnimatedPrice value={1000} />)
    rerender(<AnimatedPrice value={1000} />)
    expect(screen.getByText('$1,000')).toBeTruthy()
  })
})
