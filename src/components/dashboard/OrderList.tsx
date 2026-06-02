import Image from 'next/image'
import type { Database, OrderStatus, OrderItem } from '@/lib/types/database.types'
import StatusBadge from '@/components/ui/StatusBadge'
import { getProductImage } from '@/lib/product-images'

type Order = Database['public']['Tables']['orders']['Row']

// Linear fulfilment flow shown as a stepper. 'cancelled' is off this track and
// rendered as a distinct banner instead.
const FLOW: { status: OrderStatus; label: string; icon: string }[] = [
  { status: 'pending', label: 'Очікує', icon: 'schedule' },
  { status: 'confirmed', label: 'Підтверджено', icon: 'task_alt' },
  { status: 'shipped', label: 'Відправлено', icon: 'local_shipping' },
  { status: 'delivered', label: 'Доставлено', icon: 'inventory_2' },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('uk-UA', { day: '2-digit', month: 'short', year: 'numeric' })
}

function Stepper({ status }: { status: OrderStatus }) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 text-red-400">
        <span className="material-symbols-outlined text-[18px]">cancel</span>
        <span className="font-label-caps text-label-caps uppercase tracking-widest text-[11px]">Замовлення скасовано</span>
      </div>
    )
  }
  const currentIdx = FLOW.findIndex(s => s.status === status)
  return (
    <div className="flex items-center">
      {FLOW.map((step, i) => {
        const done = i <= currentIdx
        return (
          <div key={step.status} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <span
                className={`flex items-center justify-center w-8 h-8 rounded-full border transition-colors ${
                  done ? 'bg-primary/15 border-primary/40 text-primary' : 'border-card-border text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{step.icon}</span>
              </span>
              <span className={`font-label-caps text-[8px] uppercase tracking-widest text-center ${done ? 'text-primary' : 'text-on-surface-variant'}`}>
                {step.label}
              </span>
            </div>
            {i < FLOW.length - 1 && (
              <div className={`h-px flex-1 mx-1 mb-4 ${i < currentIdx ? 'bg-primary/40' : 'bg-card-border'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function OrderList({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-16">
        <span className="material-symbols-outlined text-outline-variant text-[64px]">receipt_long</span>
        <p className="font-body-md text-body-md text-on-surface-variant mt-4">
          Замовлень ще немає
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map(order => {
        const items: OrderItem[] = Array.isArray(order.items) ? order.items : []
        const itemCount = items.reduce((n, it) => n + (it.qty ?? 0), 0)
        return (
          <div key={order.id} className="bg-card border-card rounded-lg p-6 space-y-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">
                  {formatDate(order.created_at)} · {itemCount} {itemCount === 1 ? 'позиція' : 'позицій'}
                </p>
                <p className="font-technical-data text-technical-data text-on-surface mt-1">
                  #{order.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <StatusBadge status={order.status} />
            </div>

            {/* Fulfilment stepper */}
            <div className="border-t border-card-border pt-4">
              <Stepper status={order.status} />
            </div>

            {/* Items with thumbnails */}
            <div className="border-t border-card-border pt-4 space-y-3">
              {items.map((item, i) => {
                const img = getProductImage(item.name, item.image_url)
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="relative w-11 h-11 rounded bg-surface border border-card-border shrink-0 overflow-hidden flex items-center justify-center">
                      {img ? (
                        <Image src={img} alt={item.name} fill sizes="44px" className="object-contain p-1" />
                      ) : (
                        <span className="material-symbols-outlined text-outline-variant text-[20px]">memory</span>
                      )}
                    </div>
                    <span className="font-body-md text-body-md text-on-surface flex-1 min-w-0">{item.name}</span>
                    <span className="font-label-caps text-label-caps text-on-surface-variant text-[11px] shrink-0">
                      {item.qty} × ${item.price_usdt.toLocaleString()}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="border-t border-card-border pt-3 flex flex-wrap justify-between items-center gap-3">
              <div>
                <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">
                  Адреса доставки
                </p>
                <p className="font-body-md text-body-md text-on-surface mt-0.5">
                  {order.nova_poshta_address ?? '—'}
                </p>
              </div>
              <div className="text-right">
                {order.promo_code && (
                  <p className="font-label-caps text-label-caps text-primary text-[10px] uppercase tracking-widest">
                    Промокод: {order.promo_code} (−{order.discount_pct}%)
                  </p>
                )}
                <p className="font-headline-md text-headline-md text-primary">
                  ${order.total_usdt.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
