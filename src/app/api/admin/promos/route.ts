import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'

async function requireAdmin(): Promise<SupabaseClient<Database> | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (data?.role !== 'admin') return null
  return supabase
}

export async function POST(request: NextRequest) {
  const supabase = await requireAdmin()
  if (!supabase) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { code, discount_pct, max_uses, expires_at } = body

  if (!code || !discount_pct) return NextResponse.json({ error: 'code and discount_pct required' }, { status: 400 })

  const { data, error } = await supabase.from('promo_codes').insert({
    code: (code as string).toUpperCase().trim(),
    discount_pct: Number(discount_pct),
    max_uses: max_uses ? Number(max_uses) : null,
    expires_at: expires_at || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
