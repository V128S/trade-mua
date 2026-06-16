// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { Product } from '@/lib/sheets'
import { ProductCard } from './ProductCard'

vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }))
vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, onClick, children }: { href: string; onClick?: () => void; children: React.ReactNode }) => (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault() // jsdom can't navigate; keep the click handler only
        onClick?.()
      }}
    >
      {children}
    </a>
  ),
}))
vi.mock('next/image', () => ({ default: ({ alt }: { alt: string }) => <img alt={alt} /> }))
// Force the no-photo branch so we don't need a real image pipeline.
vi.mock('@/lib/product-images', () => ({ getProductImage: () => null }))
const trackSelectItem = vi.fn()
vi.mock('@/lib/analytics', () => ({ trackSelectItem: (...args: unknown[]) => trackSelectItem(...args) }))

afterEach(() => {
  cleanup()
  trackSelectItem.mockClear()
})

const product: Product = {
  id: 'antminer-s21',
  algorithm: 'SHA-256',
  brand: 'Bitmain',
  name: 'Antminer S21',
  hashrate: '200 TH/s',
  powerW: 3500,
  priceUSDT: 5000,
  inStock: true,
  isNew: false,
  imageUrl: null,
}

describe('ProductCard', () => {
  it('renders name, algorithm and formatted price', () => {
    render(<ProductCard product={product} />)
    expect(screen.getByText('Antminer S21')).toBeTruthy()
    expect(screen.getByText('SHA-256')).toBeTruthy()
    expect(screen.getByText('$5,000')).toBeTruthy()
  })

  it('shows an estimated daily profit only when revenue is provided', () => {
    const { rerender } = render(<ProductCard product={product} revenuePerTH={0} />)
    expect(screen.queryByText(/~\$/)).toBeNull()
    rerender(<ProductCard product={product} revenuePerTH={0.2} />)
    expect(screen.getByText(/~\$/)).toBeTruthy()
  })

  it('fires select_item on click only when list context is provided', () => {
    const { rerender } = render(<ProductCard product={product} />)
    fireEvent.click(screen.getByText('Antminer S21'))
    expect(trackSelectItem).not.toHaveBeenCalled()

    rerender(<ProductCard product={product} listId="catalog" listName="Каталог" index={3} />)
    fireEvent.click(screen.getByText('Antminer S21'))
    expect(trackSelectItem).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'antminer-s21', brand: 'Bitmain', algorithm: 'SHA-256', priceUSDT: 5000 }),
      { listId: 'catalog', listName: 'Каталог', index: 3 },
    )
  })
})
