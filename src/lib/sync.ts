import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getProducts } from '@/lib/sheets'
import type { Database } from '@/lib/types/database.types'

function getServiceSupabase() {
  return createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Pure: ids present in the DB but absent from the latest Sheet pull.
export function computeStaleIds(currentIds: string[], existingIds: string[]): string[] {
  const current = new Set(currentIds)
  return existingIds.filter((id) => !current.has(id))
}

export async function runSync(): Promise<{ synced: number; timestamp: string } | { error: string }> {
  const products = await getProducts()
  if (products.length === 0) {
    // Abort BEFORE deleting — never wipe the catalog on a failed/empty Sheet read.
    return { error: 'No products fetched from Sheets' }
  }

  const supabase = getServiceSupabase()
  const now = new Date().toISOString()

  const rows = products.map((p) => ({
    id: p.id,
    algorithm: p.algorithm,
    brand: p.brand,
    name: p.name,
    hashrate: p.hashrate,
    power_w: p.powerW,
    price_usdt: p.priceUSDT,
    in_stock: p.inStock,
    is_new: p.isNew,
    image_url: p.imageUrl,
    synced_at: now,
  }))

  const keepIds = rows.map((r) => r.id)

  // Single atomic DB call: upsert all rows + delete stale in one transaction.
  const { error } = await supabase.rpc('sync_products', {
    rows: rows,
    keep_ids: keepIds,
  })

  if (error) return { error: error.message }

  return { synced: rows.length, timestamp: now }
}
