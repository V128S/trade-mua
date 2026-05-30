'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/lib/cart/useCart'
import { applyDiscount } from '@/lib/cart/cart-math'
import { placeOrder } from '@/lib/cart/actions'

export default function CheckoutForm({ defaultPhone }: { defaultPhone: string }) {
  const { items, promo, subtotal, hydrated, clear } = useCart()
  const router = useRouter()
  const [novaPoshta, setNovaPoshta] = useState('')
  const [phone, setPhone] = useState(defaultPhone)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (hydrated && items.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="font-body-md text-body-md text-on-surface-variant">Кошик порожній.</p>
        <Link href="/products" className="btn-primary inline-flex py-3 px-6 rounded font-label-caps text-label-caps uppercase tracking-widest">До каталогу</Link>
      </div>
    )
  }

  const total = promo ? applyDiscount(subtotal, promo.pct) : subtotal

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await placeOrder({
      items: items.map(i => ({ id: i.id, qty: i.qty })),
      promoCode: promo?.code ?? null,
      novaPoshta,
      phone,
      notes,
    })
    if ('error' in res) { setError(res.error); setLoading(false); return }
    clear()
    router.push(`/dashboard/orders?success=${res.orderId}`)
  }

  const field = "w-full bg-surface border border-[#2e2d2b] rounded px-4 py-2.5 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary/60 transition-colors"
  const label = "font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest block mb-1.5 text-[11px]"

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={label}>Відділення Нової Пошти</label>
          <input value={novaPoshta} onChange={e => setNovaPoshta(e.target.value)} required placeholder="Місто, № відділення" className={field} />
        </div>
        <div>
          <label className={label}>Телефон</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+380..." className={field} />
        </div>
        <div>
          <label className={label}>Коментар (необов&apos;язково)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={field} />
        </div>
        {error && <p className="font-body-md text-body-md text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full py-3 rounded font-label-caps text-label-caps uppercase tracking-widest disabled:opacity-50">
          {loading ? 'Оформлення...' : 'Підтвердити замовлення'}
        </button>
      </form>

      <div className="bg-card border-card rounded-lg p-6 space-y-3 lg:sticky lg:top-24">
        <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest text-base">Замовлення</h2>
        {items.map(i => (
          <div key={i.id} className="flex justify-between gap-2 font-body-md text-sm text-on-surface-variant">
            <span className="truncate">{i.name} × {i.qty}</span>
            <span className="text-on-surface whitespace-nowrap">${(i.priceUSDT * i.qty).toLocaleString()}</span>
          </div>
        ))}
        {promo && (
          <div className="flex justify-between font-body-md text-sm text-on-surface-variant border-t border-[#2e2d2b] pt-2">
            <span>Промокод {promo.code}</span><span>−{promo.pct}%</span>
          </div>
        )}
        <div className="flex justify-between border-t border-[#2e2d2b] pt-3">
          <span className="font-label-caps text-label-caps uppercase tracking-widest text-[11px] text-on-surface-variant">Разом</span>
          <span className="font-headline-md text-headline-md text-primary">${total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}
