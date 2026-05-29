import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const supabase = await requireAdmin()
  if (!supabase) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { code, discount_pct, max_uses, expires_at } = body

  if (!code) return NextResponse.json({ error: 'code is required' }, { status: 400 })
  if (discount_pct === undefined || discount_pct === null || discount_pct === '') {
    return NextResponse.json({ error: 'discount_pct is required' }, { status: 400 })
  }

  const pct = Number(discount_pct)
  if (isNaN(pct) || pct < 0 || pct > 100) {
    return NextResponse.json({ error: 'discount_pct must be 0–100' }, { status: 400 })
  }

  const { data, error } = await supabase.from('promo_codes').insert({
    code: (code as string).toUpperCase().trim(),
    discount_pct: pct,
    max_uses: max_uses ? Number(max_uses) : null,
    expires_at: expires_at || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
