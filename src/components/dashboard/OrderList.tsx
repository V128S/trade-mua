import type { Database } from '@/lib/types/database.types'
import StatusBadge from '@/components/ui/StatusBadge'

type Order = Database['public']['Tables']['orders']['Row']

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('uk-UA', { day: '2-digit', month: 'short', year: 'numeric' })
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
      {orders.map(order => (
        <div key={order.id} className="bg-card border-card rounded-lg p-6 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">
                {formatDate(order.created_at)}
              </p>
              <p className="font-technical-data text-technical-data text-on-surface mt-1">
                #{order.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <StatusBadge status={order.status} />
          </div>

          <div className="border-t border-[#2e2d2b] pt-4 space-y-2">
            {(Array.isArray(order.items) ? order.items as { name: string; qty: number; price_usdt: number }[] : []).map((item, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="font-body-md text-body-md text-on-surface">{item.name}</span>
                <span className="font-label-caps text-label-caps text-on-surface-variant text-[11px]">
                  {item.qty} × ${item.price_usdt.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-[#2e2d2b] pt-3 flex flex-wrap justify-between items-center gap-3">
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
      ))}
    </div>
  )
}
