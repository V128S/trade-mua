import { createClient } from '@/lib/supabase/server'
import { getLastSyncTime } from '@/lib/products'
import ProductsSyncPanel from '@/components/admin/ProductsSyncPanel'

export default async function AdminProductsPage() {
  const supabase = await createClient()
  const { count } = await supabase.from('products').select('*', { count: 'exact', head: true })
  const lastSync = await getLastSyncTime()

  return (
    <div>
      <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest text-base mb-6">
        Синхронізація товарів
      </h2>
      <ProductsSyncPanel
        lastSync={lastSync}
        productCount={count ?? 0}
        syncSecret={process.env.SYNC_SECRET!}
      />
    </div>
  )
}
