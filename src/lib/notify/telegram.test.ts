import { describe, it, expect } from 'vitest'
import { formatOrderMessage, type OrderNotification } from './telegram'

const base: OrderNotification = {
  id: 'abcdef12-3456-7890-abcd-ef1234567890',
  items: [
    { product_id: 'p1', name: 'Antminer S21', price_usdt: 5000, qty: 2 },
    { product_id: 'p2', name: 'Whatsminer M60', price_usdt: 4000, qty: 1 },
  ],
  total: 14000,
  firstName: 'Денис',
  lastName: 'Коваленко',
  phone: '+380501234567',
  city: 'Дніпро',
  branch: 'Відділення №5',
  notes: null,
  promoCode: null,
  discountPct: null,
}

describe('formatOrderMessage', () => {
  it('includes a short order id', () => {
    expect(formatOrderMessage(base)).toContain('abcdef12')
  })

  it('includes customer name and phone', () => {
    const msg = formatOrderMessage(base)
    expect(msg).toContain('Денис')
    expect(msg).toContain('Коваленко')
    expect(msg).toContain('+380501234567')
  })

  it('lists every product line with quantity', () => {
    const msg = formatOrderMessage(base)
    expect(msg).toContain('Antminer S21')
    expect(msg).toContain('×2')
    expect(msg).toContain('Whatsminer M60')
    expect(msg).toContain('×1')
  })

  it('includes total, city and branch', () => {
    const msg = formatOrderMessage(base)
    expect(msg).toContain('14,000')
    expect(msg).toContain('Дніпро')
    expect(msg).toContain('Відділення №5')
  })

  it('includes the admin orders link', () => {
    expect(formatOrderMessage(base)).toContain('/admin/orders')
  })

  it('omits the promo line when no promo', () => {
    expect(formatOrderMessage(base)).not.toContain('Промокод')
  })

  it('shows the promo line and discount when present', () => {
    const msg = formatOrderMessage({ ...base, promoCode: 'SAVE10', discountPct: 10 })
    expect(msg).toContain('SAVE10')
    expect(msg).toContain('10%')
  })

  it('includes the comment when present', () => {
    const msg = formatOrderMessage({ ...base, notes: 'Подзвоніть зранку' })
    expect(msg).toContain('Подзвоніть зранку')
  })

  it('HTML-escapes user-provided fields', () => {
    const msg = formatOrderMessage({
      ...base,
      firstName: 'A<b>',
      notes: 'x & <script>',
    })
    expect(msg).toContain('A&lt;b&gt;')
    expect(msg).toContain('x &amp; &lt;script&gt;')
    // Raw, unescaped user input must not survive into the message.
    expect(msg).not.toContain('A<b>')
    expect(msg).not.toContain('<script>')
  })
})
