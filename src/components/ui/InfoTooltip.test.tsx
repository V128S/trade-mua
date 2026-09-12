// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import InfoTooltip from './InfoTooltip'

afterEach(() => cleanup())

describe('InfoTooltip', () => {
  it('renders the trigger content, tooltip hidden until hovered', () => {
    render(<InfoTooltip tooltip="Explanation text">Live</InfoTooltip>)
    expect(screen.getByText('Live')).toBeTruthy()
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('shows the tooltip on hover and hides it on mouse-leave', () => {
    render(<InfoTooltip tooltip="Explanation text">Live</InfoTooltip>)
    const trigger = screen.getByText('Live').closest('span')!
    fireEvent.mouseEnter(trigger)
    expect(screen.getByRole('tooltip').textContent).toBe('Explanation text')
    fireEvent.mouseLeave(trigger)
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('shows the tooltip on keyboard focus and hides it on blur', () => {
    render(<InfoTooltip tooltip="Explanation text">Live</InfoTooltip>)
    const trigger = screen.getByText('Live').closest('span')!
    fireEvent.focus(trigger)
    expect(screen.getByRole('tooltip').textContent).toBe('Explanation text')
    fireEvent.blur(trigger)
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('renders the tooltip into document.body (escapes any clipping ancestor)', () => {
    const { container } = render(
      <div style={{ overflow: 'hidden' }}>
        <InfoTooltip tooltip="Explanation text">Live</InfoTooltip>
      </div>,
    )
    const trigger = screen.getByText('Live').closest('span')!
    fireEvent.mouseEnter(trigger)
    const tooltip = screen.getByRole('tooltip')
    expect(container.contains(tooltip)).toBe(false)
    expect(document.body.contains(tooltip)).toBe(true)
  })
})
