// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { useHydrated } from './useHydrated'

function Probe() {
  return <span data-testid="probe">{String(useHydrated())}</span>
}

describe('useHydrated', () => {
  it('is false when server-rendered', () => {
    expect(renderToString(<Probe />)).toContain('false')
  })

  it('is true after client render', () => {
    render(<Probe />)
    expect(screen.getByTestId('probe').textContent).toBe('true')
  })
})
