'use client'
import { useState } from 'react'
import { useCart } from '@/lib/cart/useCart'
import type { Product } from '@/lib/sheets'

type Props = { product: Pick<Product, 'id' | 'name' | 'hashrate' | 'powerW' | 'priceUSDT' | 'inStock'> }

export default function AddToCartButton({ product }: Props) {
  const { add } = useCart()
  const [added, setAdded] = useState(false)

  function handleAdd() {
    add({
      id: product.id,
      name: product.name,
      hashrate: product.hashrate,
      powerW: product.powerW,
      priceUSDT: product.priceUSDT,
    })
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1500)
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      className="btn-primary py-4 px-8 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-transform"
    >
      <span className="material-symbols-outlined text-[18px]">{added ? 'check' : 'shopping_cart'}</span>
      {added ? 'Додано' : product.inStock ? 'Додати в кошик' : 'Замовити'}
    </button>
  )
}
