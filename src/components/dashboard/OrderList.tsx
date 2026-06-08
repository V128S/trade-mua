import type { Database } from '@/lib/types/database.types'
import OrderCard from '@/components/dashboard/OrderCard'

type Order = Database['public']['Tables']['orders']['Row']

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
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  )
}
