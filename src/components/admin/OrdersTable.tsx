'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import StatusBadge from '@/components/ui/StatusBadge'
import type { Database, OrderStatus } from '@/lib/types/database.types'

type Order = Database['public']['Tables']['orders']['Row'] & { profile?: { full_name: string | null } | null }

const STATUSES: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
const STATUS_UA: Record<OrderStatus, string> = {
  pending: 'Очікує', confirmed: 'Підтверджено', shipped: 'Відправлено',
  delivered: 'Доставлено', cancelled: 'Скасовано',
}

export default function OrdersTable({ orders }: { orders: Order[] }) {
  const router = useRouter()
  const [updating, setUpdating] = useState<string | null>(null)

  async function updateStatus(orderId: string, status: OrderStatus) {
    setUpdating(orderId)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        console.error('Status update failed:', data.error ?? res.status)
      }
    } catch (err) {
      console.error('Network error updating order status:', err)
    } finally {
      setUpdating(null)
      router.refresh()
    }
  }

  if (orders.length === 0) {
    return <p className="font-body-md text-body-md text-on-surface-variant py-8">Замовлень немає</p>
  }

  return (
    <div className="space-y-4">
      {orders.map(order => (
        <div key={order.id} className="bg-card border-card rounded-lg p-5 space-y-3">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">
                #{order.id.slice(0, 8).toUpperCase()} · {new Date(order.created_at).toLocaleDateString('uk-UA')}
              </p>
              <p className="font-body-md text-body-md text-on-surface mt-0.5">
                {order.profile?.full_name ?? 'Анонім'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={order.status} />
              <select
                value={order.status}
                disabled={updating === order.id}
                onChange={e => updateStatus(order.id, e.target.value as OrderStatus)}
                className="bg-surface border border-[#2e2d2b] rounded px-2 py-1 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px] focus:outline-none focus:border-primary/60 disabled:opacity-50"
              >
                {STATUSES.map(s => (
                  <option key={s} value={s}>{STATUS_UA[s]}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap justify-between items-end gap-3 border-t border-[#2e2d2b] pt-3">
            <div>
              <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">Нова Пошта</p>
              <p className="font-body-md text-body-md text-on-surface mt-0.5">{order.nova_poshta_address ?? '—'}</p>
            </div>
            <p className="font-headline-md text-headline-md text-primary">${order.total_usdt.toLocaleString()}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
