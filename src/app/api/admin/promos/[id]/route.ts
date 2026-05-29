import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/admin'
import type { Database } from '@/lib/types/database.types'

type PromoUpdate = Database['public']['Tables']['promo_codes']['Update']

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await requireAdmin()
  if (!supabase) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const body = await request.json()

  // Only allow safe fields — prevents mass-assignment of uses_count, id, created_at, code
  const update: PromoUpdate = {}
  if (body.discount_pct !== undefined) update.discount_pct = Number(body.discount_pct)
  if (body.max_uses !== undefined) update.max_uses = body.max_uses ? Number(body.max_uses) : null
  if (body.expires_at !== undefined) update.expires_at = body.expires_at || null
  if (body.is_active !== undefined) update.is_active = Boolean(body.is_active)

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { error } = await supabase.from('promo_codes').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await requireAdmin()
  if (!supabase) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const { error } = await supabase.from('promo_codes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
