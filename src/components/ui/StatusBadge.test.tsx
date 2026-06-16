// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import StatusBadge from './StatusBadge'

// next-intl's hook returns the key verbatim — enough to assert which label was
// picked without loading real messages.
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }))

afterEach(cleanup)

describe('StatusBadge', () => {
  it('renders the label for a known status', () => {
    render(<StatusBadge status="shipped" />)
    expect(screen.getByText('statusShipped')).toBeTruthy()
  })

  it('falls back to the unknown label for an unrecognized status', () => {
    render(<StatusBadge status="bogus" />)
    expect(screen.getByText('statusUnknown')).toBeTruthy()
  })

  it('applies the status-specific chip classes', () => {
    render(<StatusBadge status="cancelled" />)
    const el = screen.getByText('statusCancelled')
    expect(el.className).toContain('chip')
    expect(el.className).toContain('text-red-700')
  })
})
