import { createClient } from '@/lib/supabase/server'
import type { Product } from '@/lib/sheets'
import type { Database } from '@/lib/types/database.types'

type ProductRow = Database['public']['Tables']['products']['Row']

// Exactly the columns mapRow consumes — avoids select('*') over-fetch on the
// catalog (every card) and similar-products paths.
const PRODUCT_COLUMNS =
  'id, algorithm, brand, name, hashrate, power_w, price_usdt, in_stock, is_new, image_url, image_url_admin, synced_at'

// Single source of truth for DB row → Product mapping (used by every reader below).
function mapRow(row: ProductRow): Product {
  return {
    id: row.id,
    algorithm: row.algorithm,
    brand: row.brand,
    name: row.name,
    hashrate: row.hashrate,
    powerW: row.power_w,
    priceUSDT: Number(row.price_usdt),
    inStock: row.in_stock,
    isNew: row.is_new,
    // Effective photo override: admin upload wins over the Sheet URL. Anything
    // null here falls through to the name→file mapping in getProductImage.
    imageUrl: row.image_url_admin ?? row.image_url ?? null,
  }
}

export async function getProductsFromDB(): Promise<Product[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .order('price_usdt', { ascending: false })

  if (error || !data) {
    if (error) console.error('[products] DB read failed:', error.message)
    return []
  }

  return data.map(mapRow)
}

export async function getTopProductsFromDB(limit = 8): Promise<Product[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .order('price_usdt', { ascending: false })
    .limit(limit)

  if (error || !data) {
    if (error) console.error('[products] DB read failed:', error.message)
    return []
  }

  return data.map(mapRow)
}

// Top products by price, then shuffled so display order varies each revalidation.
// Shuffle lives here (data layer) rather than in the page render to keep the
// Server Component pure.
export async function getShuffledTopProductsFromDB(limit = 8): Promise<Product[]> {
  const products = await getTopProductsFromDB(limit)
  for (let i = products.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [products[i], products[j]] = [products[j], products[i]]
  }
  return products
}

export async function getRandomProductsFromDB(count: number): Promise<Product[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('random_products', { n: count })
  if (error || !data) {
    if (error) console.error('[products] random RPC failed:', error.message)
    return []
  }
  return (data as unknown as ProductRow[]).map(mapRow)
}

export async function getLastSyncTime(): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('synced_at')
    .order('synced_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data?.synced_at ?? null
}

// Lightweight id+synced_at pairs for sitemap lastModified — avoids fetching
// full product rows when we only need the modification timestamp.
export async function getProductModifiedDates(): Promise<{ id: string; syncedAt: string | null }[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('id, synced_at')
  if (error || !data) return []
  return data.map((r) => ({ id: r.id, syncedAt: r.synced_at }))
}
