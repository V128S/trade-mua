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

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const isValidBearer = authHeader === `Bearer ${process.env.SYNC_SECRET}`
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'
  return isValidBearer || isVercelCron
}

async function runSync(): Promise<{ synced: number; timestamp: string } | { error: string }> {
  const products = await getProducts()
  if (products.length === 0) {
    return { error: 'No products fetched from Sheets' }
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
    image_url: p.imageUrl,
    synced_at: now,
  }))

  const { error: upsertError } = await supabase
    .from('products')
    .upsert(rows, { onConflict: 'id' })

  if (upsertError) return { error: upsertError.message }

  // Remove rows no longer in the Sheet. Compute the stale set and delete it with
  // an array filter: supabase-js `.in()` quotes/escapes each value, so a
  // SKU-derived id containing reserved chars (",", "(", ")") can't corrupt the
  // filter the way a string-interpolated `not.in.(…)` could.
  const currentIds = new Set(rows.map(r => r.id))
  const { data: existing, error: fetchError } = await supabase
    .from('products')
    .select('id')

  if (fetchError) return { error: `Sync ok but cleanup failed: ${fetchError.message}` }

  const staleIds = (existing ?? []).map(r => r.id).filter(id => !currentIds.has(id))
  if (staleIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .in('id', staleIds)

    if (deleteError) return { error: `Sync ok but cleanup failed: ${deleteError.message}` }
  }

  return { synced: rows.length, timestamp: now }
}

// Called by Google Apps Script webhook (POST with Bearer token)
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const result = await runSync()
  if ('error' in result) return NextResponse.json(result, { status: 500 })
  return NextResponse.json(result)
}

// Called by Vercel Cron (GET request)
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const result = await runSync()
  if ('error' in result) return NextResponse.json(result, { status: 500 })
  return NextResponse.json(result)
}
