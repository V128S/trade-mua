// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import InfoTooltip from './InfoTooltip'

afterEach(() => cleanup())

describe('InfoTooltip', () => {
  it('renders a small labeled trigger button', () => {
    render(<InfoTooltip label="About the price">Explanation text</InfoTooltip>)
    const button = screen.getByLabelText('About the price')
    expect(button.tagName).toBe('BUTTON')
  })

  it('renders the tooltip content, hidden until hover/focus via opacity', () => {
    render(<InfoTooltip label="About the price">Explanation text</InfoTooltip>)
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip.textContent).toBe('Explanation text')
    // Pure-CSS reveal: present in the DOM but invisible/non-interactive
    // until the wrapping group is hovered or focus-within.
    expect(tooltip.className).toContain('opacity-0')
    expect(tooltip.className).toContain('pointer-events-none')
    expect(tooltip.className).toContain('group-hover:opacity-100')
    expect(tooltip.className).toContain('group-focus-within:opacity-100')
  })
})
