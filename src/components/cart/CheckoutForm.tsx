'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useCart } from '@/lib/cart/useCart'
import { applyDiscount } from '@/lib/cart/cart-math'
import { placeOrder } from '@/lib/cart/actions'
import { splitFullName } from '@/lib/cart/shipping'

export default function CheckoutForm({ defaultPhone, defaultFullName }: { defaultPhone: string; defaultFullName: string }) {
  const t = useTranslations('checkout')
  const { items, promo, subtotal, hydrated, clear } = useCart()
  const router = useRouter()
  const prefill = useMemo(() => splitFullName(defaultFullName), [defaultFullName])
  const [firstName, setFirstName] = useState(prefill.first)
  const [lastName, setLastName] = useState(prefill.last)
  const [phone, setPhone] = useState(defaultPhone)
  const [city, setCity] = useState('')
  const [branch, setBranch] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (hydrated && items.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="font-body-md text-body-md text-on-surface-variant">{t('emptyCart')}</p>
        <Link href="/products" className="btn-primary inline-flex py-3 px-6 rounded font-label-caps text-label-caps uppercase tracking-widest">{t('toCatalog')}</Link>
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
      firstName,
      lastName,
      phone,
      city,
      branch,
      notes,
    })
    if ('error' in res) { setError(res.error); setLoading(false); return }
    clear()
    router.push(`/dashboard/orders?success=${res.orderId}`)
  }

  const field = "w-full bg-surface border border-card-border rounded px-4 py-2.5 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary/60 transition-colors"
  const labelCls = "font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest block mb-1.5 text-[11px]"

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="co-first-name" className={labelCls}>{t('labelFirstName')}</label>
            <input id="co-first-name" autoComplete="given-name" value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder={t('labelFirstName')} className={field} />
          </div>
          <div>
            <label htmlFor="co-last-name" className={labelCls}>{t('labelLastName')}</label>
            <input id="co-last-name" autoComplete="family-name" value={lastName} onChange={e => setLastName(e.target.value)} required placeholder={t('labelLastName')} className={field} />
          </div>
        </div>
        <div>
          <label htmlFor="co-phone" className={labelCls}>{t('labelPhone')}</label>
          <input id="co-phone" type="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+380..." className={field} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="co-city" className={labelCls}>{t('labelCity')}</label>
            <input id="co-city" autoComplete="address-level2" value={city} onChange={e => setCity(e.target.value)} required placeholder={t('placeholderCity')} className={field} />
          </div>
          <div>
            <label htmlFor="co-branch" className={labelCls}>{t('labelBranch')}</label>
            <input id="co-branch" autoComplete="off" value={branch} onChange={e => setBranch(e.target.value)} required placeholder={t('placeholderBranch')} className={field} />
          </div>
        </div>
        <div>
          <label htmlFor="co-notes" className={labelCls}>{t('labelComment')}</label>
          <textarea id="co-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={field} />
        </div>
        {error && <p className="font-body-md text-body-md text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full py-3 rounded font-label-caps text-label-caps uppercase tracking-widest disabled:opacity-50">
          {loading ? t('submitting') : t('submit')}
        </button>
      </form>

      <div className="bg-card border-card rounded-lg p-6 space-y-3 lg:sticky lg:top-24">
        <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest text-base">{t('orderSummary')}</h2>
        {items.map(i => (
          <div key={i.id} className="flex justify-between gap-2 font-body-md text-sm text-on-surface-variant">
            <span className="truncate">{i.name} × {i.qty}</span>
            <span className="text-on-surface whitespace-nowrap">${(i.priceUSDT * i.qty).toLocaleString()}</span>
          </div>
        ))}
        {promo && (
          <div className="flex justify-between font-body-md text-sm text-on-surface-variant border-t border-card-border pt-2">
            <span>{t('promoLine', { code: promo.code })}</span><span>−{promo.pct}%</span>
          </div>
        )}
        <div className="flex justify-between border-t border-card-border pt-3">
          <span className="font-label-caps text-label-caps uppercase tracking-widest text-[11px] text-on-surface-variant">{t('total')}</span>
          <span className="font-headline-md text-headline-md text-primary">${total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}
