'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/lib/cart/useCart'
import { getProductImage } from '@/lib/product-images'
import { previewPromo } from '@/lib/cart/actions'
import { applyDiscount } from '@/lib/cart/cart-math'

export default function CartView() {
  const { items, hydrated, subtotal, setQty, remove, promo, setPromo, clearPromo } = useCart()

  const [code, setCode] = useState('')
  const [promoError, setPromoError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  async function handleApplyPromo() {
    setChecking(true)
    setPromoError(null)
    const res = await previewPromo(code)
    setChecking(false)
    if ('error' in res) { setPromoError(res.error); clearPromo(); return }
    setPromo({ code: code.trim().toUpperCase(), pct: res.discountPct })
  }

  const total = promo ? applyDiscount(subtotal, promo.pct) : subtotal

  if (!hydrated) return <div className="py-24" />

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center text-center gap-8 py-12">
        <span className="material-symbols-outlined text-outline-variant text-[80px]">shopping_cart</span>
        <div className="space-y-2">
          <h1 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest">Кошик порожній</h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
            Додайте товари з каталогу або зв&apos;яжіться з нами напряму — ми підберемо найкращий варіант.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/products" className="btn-primary py-4 px-8 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">inventory_2</span>
            Перейти до каталогу
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
      {/* Items */}
      <div className="space-y-4">
        {items.map(i => {
          const img = getProductImage(i.name)
          return (
            <div key={i.id} className="bg-card border-card rounded-lg p-4 flex gap-4 items-center">
              <div className="relative w-20 h-20 bg-white rounded shrink-0 flex items-center justify-center overflow-hidden">
                {img ? (
                  <Image src={img} alt={i.name} width={72} height={72} className="object-contain" />
                ) : (
                  <span className="material-symbols-outlined text-outline-variant text-[32px]">memory</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/products/${i.id}`} className="font-technical-data text-technical-data text-on-surface hover:text-primary transition-colors block truncate">
                  {i.name}
                </Link>
                <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">
                  {i.hashrate ? `${i.hashrate} · ` : ''}{i.powerW} W
                </p>
                <p className="font-headline-md text-headline-md text-primary mt-1">${i.priceUSDT.toLocaleString()}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center border border-[#2e2d2b] rounded">
                  <button type="button" aria-label="Зменшити" onClick={() => setQty(i.id, i.qty - 1)} className="w-8 h-8 text-on-surface-variant hover:text-primary">−</button>
                  <span className="w-8 text-center font-technical-data text-technical-data text-on-surface">{i.qty}</span>
                  <button type="button" aria-label="Збільшити" onClick={() => setQty(i.id, i.qty + 1)} className="w-8 h-8 text-on-surface-variant hover:text-primary">+</button>
                </div>
                <button type="button" onClick={() => remove(i.id)} className="font-label-caps text-[10px] text-on-surface-variant hover:text-red-400 uppercase tracking-widest transition-colors">
                  Видалити
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="bg-card border-card rounded-lg p-6 space-y-4 lg:sticky lg:top-24">
        <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest text-base">Разом</h2>
        <div className="flex justify-between font-body-md text-body-md text-on-surface-variant">
          <span>Сума</span>
          <span className="text-on-surface font-technical-data">${subtotal.toLocaleString()}</span>
        </div>

        {/* Promo */}
        <div className="space-y-2">
          {promo ? (
            <div className="flex justify-between items-center font-body-md text-body-md">
              <span className="text-on-surface-variant">Промокод <span className="text-primary font-technical-data">{promo.code}</span> (−{promo.pct}%)</span>
              <button type="button" onClick={() => { clearPromo(); setCode(''); }} className="material-symbols-outlined text-[16px] text-on-surface-variant hover:text-red-400">close</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="Промокод"
                className="flex-1 min-w-0 bg-surface border border-[#2e2d2b] rounded px-3 py-2 font-technical-data text-technical-data text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/60"
              />
              <button type="button" onClick={handleApplyPromo} disabled={checking} className="btn-ghost px-4 rounded font-label-caps text-label-caps uppercase tracking-widest text-xs disabled:opacity-50">
                {checking ? '...' : 'Застос.'}
              </button>
            </div>
          )}
          {promoError && <p className="font-label-caps text-[10px] text-red-400">{promoError}</p>}
        </div>

        {promo && (
          <div className="flex justify-between font-body-md text-body-md text-on-surface border-t border-[#2e2d2b] pt-3">
            <span className="uppercase font-label-caps tracking-widest text-[11px]">Разом</span>
            <span className="font-headline-md text-headline-md text-primary">${total.toLocaleString()}</span>
          </div>
        )}

        <Link href="/checkout" className="btn-primary w-full py-3 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center justify-center gap-2">
          Перейти до оформлення
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </Link>
      </div>
    </div>
  )
}
