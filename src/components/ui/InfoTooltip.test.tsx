// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import InfoTooltip from './InfoTooltip'

afterEach(() => cleanup())

describe('InfoTooltip', () => {
  it('renders the trigger with the given label, tooltip hidden by default', () => {
    render(<InfoTooltip label="About the price">Explanation text</InfoTooltip>)
    expect(screen.getByLabelText('About the price')).toBeTruthy()
    expect(screen.queryByText('Explanation text')).toBeNull()
  })

  it('reveals the tooltip content on click', () => {
    render(<InfoTooltip label="About the price">Explanation text</InfoTooltip>)
    fireEvent.click(screen.getByLabelText('About the price'))
    expect(screen.getByText('Explanation text')).toBeTruthy()
  })

  it('hides the tooltip again on a second click', () => {
    render(<InfoTooltip label="About the price">Explanation text</InfoTooltip>)
    const button = screen.getByLabelText('About the price')
    fireEvent.click(button)
    fireEvent.click(button)
    expect(screen.queryByText('Explanation text')).toBeNull()
  })

  it('closes when the trigger loses focus', () => {
    render(<InfoTooltip label="About the price">Explanation text</InfoTooltip>)
    const button = screen.getByLabelText('About the price')
    fireEvent.click(button)
    expect(screen.getByText('Explanation text')).toBeTruthy()
    fireEvent.blur(button)
    expect(screen.queryByText('Explanation text')).toBeNull()
  })
})
