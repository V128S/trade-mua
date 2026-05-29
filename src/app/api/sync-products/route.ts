import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getProducts } from '@/lib/sheets'
import type { Database } from '@/lib/types/database.types'

function getServiceSupabase() {
  return createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const isValidBearer = authHeader === `Bearer ${process.env.SYNC_SECRET}`
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'

  if (!isValidBearer && !isVercelCron) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const products = await getProducts()
  if (products.length === 0) {
    return NextResponse.json({ error: 'No products fetched from Sheets' }, { status: 500 })
  }

  const supabase = getServiceSupabase()
  const now = new Date().toISOString()

  const rows = products.map(p => ({
    id: p.id,
    algorithm: p.algorithm,
    brand: p.brand,
    name: p.name,
    hashrate: p.hashrate,
    power_w: p.powerW,
    price_usdt: p.priceUSDT,
    in_stock: p.inStock,
    is_new: p.isNew,
    synced_at: now,
  }))

  const { error: upsertError } = await supabase
    .from('products')
    .upsert(rows, { onConflict: 'id' })

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  // Remove products no longer in Sheets
  const currentIds = rows.map(r => r.id)
  await supabase
    .from('products')
    .delete()
    .not('id', 'in', `(${currentIds.map(id => `"${id}"`).join(',')})`)

  return NextResponse.json({ synced: rows.length, timestamp: now })
}
