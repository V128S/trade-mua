import { createClient } from '@/lib/supabase/server'
import OrdersTable from '@/components/admin/OrdersTable'

export default async function AdminOrdersPage() {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: orders } = await supabase
    .from('orders')
    .select('*, profile:profiles(full_name)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest text-base mb-6">
        Замовлення ({(orders ?? []).length})
      </h2>
      <OrdersTable orders={(orders as Parameters<typeof OrdersTable>[0]['orders']) ?? []} />
    </div>
  )
}
