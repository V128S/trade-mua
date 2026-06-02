'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import StatusBadge from '@/components/ui/StatusBadge'
import type { Database, OrderStatus, OrderItem } from '@/lib/types/database.types'

type Order = Database['public']['Tables']['orders']['Row'] & {
  profile?: { full_name: string | null; phone: string | null } | null
}

const STATUSES: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
const STATUS_UA: Record<OrderStatus, string> = {
  pending: 'Очікує', confirmed: 'Підтверджено', shipped: 'Відправлено',
  delivered: 'Доставлено', cancelled: 'Скасовано',
}

export default function OrdersTable({ orders }: { orders: Order[] }) {
  const router = useRouter()
  const [updating, setUpdating] = useState<string | null>(null)
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all')
  const [query, setQuery] = useState('')

  // Counters: how many in each status + live revenue (everything not cancelled).
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length }
    for (const s of STATUSES) c[s] = 0
    for (const o of orders) c[o.status] = (c[o.status] ?? 0) + 1
    return c
  }, [orders])

  const revenue = useMemo(
    () => orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + Number(o.total_usdt), 0),
    [orders],
  )

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return orders.filter(o => {
      if (filter !== 'all' && o.status !== filter) return false
      if (!q) return true
      const name = (
        [o.recipient_first_name, o.recipient_last_name].filter(Boolean).join(' ') ||
        o.profile?.full_name ||
        ''
      ).toLowerCase()
      return o.id.toLowerCase().includes(q) || name.includes(q)
    })
  }, [orders, filter, query])

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
    <div className="space-y-5">
      {/* Summary counters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="bg-card border-card rounded-lg px-4 py-2.5">
          <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[9px]">Виручка (без скасованих)</p>
          <p className="font-headline-md text-headline-md text-primary text-lg">${revenue.toLocaleString()}</p>
        </div>
        <div className="bg-card border-card rounded-lg px-4 py-2.5">
          <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[9px]">Всього замовлень</p>
          <p className="font-headline-md text-headline-md text-on-surface text-lg">{orders.length}</p>
        </div>
      </div>

      {/* Filter tabs + search */}
      <div className="flex flex-wrap items-center gap-2">
        {(['all', ...STATUSES] as const).map(s => {
          const active = filter === s
          const label = s === 'all' ? 'Всі' : STATUS_UA[s]
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded font-label-caps text-label-caps uppercase tracking-widest text-[10px] transition-colors border ${
                active
                  ? 'bg-primary/10 text-primary border-primary/40'
                  : 'text-on-surface-variant border-card-border hover:text-primary hover:border-primary/30'
              }`}
            >
              {label} ({counts[s] ?? 0})
            </button>
          )
        })}
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Пошук за #ID або ім'ям…"
          className="ml-auto bg-surface border border-card-border rounded px-3 py-1.5 font-body-md text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary/60 min-w-[200px]"
        />
      </div>

      {visible.length === 0 ? (
        <p className="font-body-md text-body-md text-on-surface-variant py-8">Нічого не знайдено</p>
      ) : (
        <div className="space-y-4">
          {visible.map(order => {
            const items: OrderItem[] = Array.isArray(order.items) ? order.items : []
            const recipientName =
              [order.recipient_first_name, order.recipient_last_name].filter(Boolean).join(' ').trim() ||
              order.profile?.full_name ||
              'Анонім'
            const recipientPhone = order.recipient_phone ?? order.profile?.phone ?? null
            return (
              <div key={order.id} className="bg-card border-card rounded-lg p-5 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">
                      #{order.id.slice(0, 8).toUpperCase()} · {new Date(order.created_at).toLocaleDateString('uk-UA')}
                    </p>
                    <Link
                      href={`/admin/users/${order.user_id}`}
                      className="font-body-md text-body-md text-on-surface mt-0.5 hover:text-primary transition-colors inline-block"
                    >
                      {recipientName}
                    </Link>
                    {recipientPhone && (
                      <a
                        href={`tel:${recipientPhone}`}
                        className="block font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors text-[11px] mt-0.5"
                      >
                        {recipientPhone}
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
                    <select
                      value={order.status}
                      disabled={updating === order.id}
                      onChange={e => updateStatus(order.id, e.target.value as OrderStatus)}
                      className="bg-surface border border-card-border rounded px-2 py-1 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px] focus:outline-none focus:border-primary/60 disabled:opacity-50"
                    >
                      {STATUSES.map(s => (
                        <option key={s} value={s}>{STATUS_UA[s]}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Line items */}
                {items.length > 0 && (
                  <div className="border-t border-card-border pt-3 space-y-1.5">
                    {items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center gap-3">
                        <span className="font-body-md text-body-md text-on-surface text-sm">{item.name}</span>
                        <span className="font-label-caps text-label-caps text-on-surface-variant text-[11px] shrink-0">
                          {item.qty} × ${item.price_usdt.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Notes */}
                {order.notes && (
                  <div className="border-t border-card-border pt-3">
                    <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">Коментар</p>
                    <p className="font-body-md text-body-md text-on-surface text-sm mt-0.5">{order.notes}</p>
                  </div>
                )}

                {/* Footer: address + promo + total */}
                <div className="flex flex-wrap justify-between items-end gap-3 border-t border-card-border pt-3">
                  <div>
                    {order.city || order.nova_poshta_branch ? (
                      <>
                        <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">Місто</p>
                        <p className="font-body-md text-body-md text-on-surface mt-0.5 text-sm">{order.city ?? '—'}</p>
                        <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px] mt-2">Відділення НП</p>
                        <p className="font-body-md text-body-md text-on-surface mt-0.5 text-sm">{order.nova_poshta_branch ?? '—'}</p>
                      </>
                    ) : (
                      <>
                        <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">Нова Пошта</p>
                        <p className="font-body-md text-body-md text-on-surface mt-0.5 text-sm">{order.nova_poshta_address ?? '—'}</p>
                      </>
                    )}
                  </div>
                  <div className="text-right">
                    {order.promo_code && (
                      <p className="font-label-caps text-label-caps text-primary text-[10px] uppercase tracking-widest">
                        {order.promo_code} (−{order.discount_pct}%)
                      </p>
                    )}
                    <p className="font-headline-md text-headline-md text-primary">${Number(order.total_usdt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
