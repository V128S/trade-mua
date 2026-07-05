// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import RuToUkPrompt from './RuToUkPrompt'

const replace = vi.fn()
let locale = 'ru'
vi.mock('next-intl', () => ({ useLocale: () => locale }))
vi.mock('@/i18n/navigation', () => ({
  usePathname: () => '/products',
  useRouter: () => ({ replace }),
}))

afterEach(() => {
  cleanup()
  replace.mockClear()
})

describe('RuToUkPrompt', () => {
  it('renders nothing outside the ru locale', () => {
    locale = 'uk'
    const { container } = render(<RuToUkPrompt />)
    expect(container.firstChild).toBeNull()
  })

  it('opens on ru and dismisses via "Залишитись"', () => {
    locale = 'ru'
    render(<RuToUkPrompt />)
    expect(screen.getByRole('dialog')).toBeTruthy()
    fireEvent.click(screen.getByText('Залишитись'))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('dismisses on Escape', () => {
    locale = 'ru'
    render(<RuToUkPrompt />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('switches to uk preserving the current path', () => {
    locale = 'ru'
    render(<RuToUkPrompt />)
    fireEvent.click(screen.getByText('Так, перейти'))
    expect(replace).toHaveBeenCalledWith('/products', { locale: 'uk' })
  })
})
