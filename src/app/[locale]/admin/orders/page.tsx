import { createClient } from '@/lib/supabase/server'
import OrdersTable from '@/components/admin/OrdersTable'
import OrdersPagination from '@/components/admin/OrdersPagination'

const PAGE_SIZE = 50

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  const supabase = await createClient()
  const { data: orders, count } = await supabase
    .from('orders')
    .select('*, profile:profiles(full_name, phone)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  const totalCount = count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  return (
    <div>
      <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest text-base mb-6">
        Замовлення ({totalCount})
      </h2>
      <OrdersTable orders={(orders as unknown as Parameters<typeof OrdersTable>[0]['orders']) ?? []} />
      {totalPages > 1 && (
        <OrdersPagination page={page} totalPages={totalPages} />
      )}
    </div>
  )
}
