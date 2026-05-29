import { createClient } from '@/lib/supabase/server'
import type { Product } from '@/lib/sheets'

export async function getProductsFromDB(): Promise<Product[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('price_usdt', { ascending: false })

  if (error || !data) return []

  return data.map(row => ({
    id: row.id,
    algorithm: row.algorithm,
    brand: row.brand,
    name: row.name,
    hashrate: row.hashrate,
    powerW: row.power_w,
    priceUSDT: Number(row.price_usdt),
    inStock: row.in_stock,
    isNew: row.is_new,
  }))
}

export async function getTopProductsFromDB(limit = 8): Promise<Product[]> {
  const all = await getProductsFromDB()
  return all.slice(0, limit)
}

export async function getLastSyncTime(): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('synced_at')
    .order('synced_at', { ascending: false })
    .limit(1)
    .single()
  return data?.synced_at ?? null
}
