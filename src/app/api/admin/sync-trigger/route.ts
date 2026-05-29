import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/admin'
import { getProducts } from '@/lib/sheets'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'

export async function POST() {
  const supabase = await requireAdmin()
  if (!supabase) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const products = await getProducts()
  if (products.length === 0) {
    return NextResponse.json({ error: 'No products fetched from Sheets' }, { status: 500 })
  }

  const service = createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const now = new Date().toISOString()
  const rows = products.map(p => ({
    id: p.id, algorithm: p.algorithm, brand: p.brand, name: p.name,
    hashrate: p.hashrate, power_w: p.powerW, price_usdt: p.priceUSDT,
    in_stock: p.inStock, is_new: p.isNew, synced_at: now,
  }))

  const { error: upsertError } = await service.from('products').upsert(rows, { onConflict: 'id' })
  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 })

  const { error: deleteError } = await service
    .from('products').delete().not('id', 'in', `(${rows.map(r => r.id).join(',')})`)
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  return NextResponse.json({ synced: rows.length, timestamp: now })
}
