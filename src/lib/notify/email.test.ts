import { describe, it, expect } from 'vitest'
import { formatCustomerOrderEmail, type OrderEmailData } from './email'

const base: OrderEmailData = {
  id: 'abcdef12-3456-7890-abcd-ef1234567890',
  email: 'customer@example.com',
  items: [{ product_id: 'p1', name: 'Antminer S21', price_usdt: 5000, qty: 2 }],
  total: 10000,
  firstName: 'Денис',
  lastName: 'Коваленко',
  city: 'Дніпро',
  branch: 'Відділення №5',
  promoCode: null,
  discountPct: null,
}

describe('formatCustomerOrderEmail', () => {
  it('builds a placed subject with the short id and brand', () => {
    const { subject } = formatCustomerOrderEmail(base, 'placed')
    expect(subject).toContain('abcdef12')
    expect(subject).toContain('прийнято')
    expect(subject).toContain('TradeM')
  })

  it('uses the right word per event', () => {
    expect(formatCustomerOrderEmail(base, 'confirmed').subject).toContain('підтверджено')
    expect(formatCustomerOrderEmail(base, 'shipped').subject).toContain('відправлено')
    expect(formatCustomerOrderEmail(base, 'delivered').subject).toContain('доставлено')
    expect(formatCustomerOrderEmail(base, 'cancelled').subject).toContain('скасовано')
  })

  it('includes items, total and the dashboard link in the html', () => {
    const { html } = formatCustomerOrderEmail(base, 'placed')
    expect(html).toContain('Antminer S21')
    expect(html).toContain('$10,000')
    expect(html).toContain('/dashboard/orders')
  })

  it('escapes html-special chars in item names', () => {
    const { html } = formatCustomerOrderEmail(
      { ...base, items: [{ product_id: 'p', name: '<b>x', price_usdt: 1, qty: 1 }] },
      'placed',
    )
    expect(html).toContain('&lt;b&gt;x')
    expect(html).not.toContain('<b>x')
  })
})
