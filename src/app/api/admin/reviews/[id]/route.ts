import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { requireStaff } from '@/lib/supabase/admin'
import type { Database } from '@/lib/types/database.types'

type ReviewUpdate = Database['public']['Tables']['reviews']['Update']

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await requireStaff()
  if (!supabase) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const body = await request.json()

  // Whitelist editable fields (prevents mass-assignment of id/created_at).
  const update: ReviewUpdate = {}
  if (body.author_name !== undefined) update.author_name = String(body.author_name).trim()
  if (body.author_location !== undefined) update.author_location = body.author_location?.trim() || null
  if (body.rating !== undefined) {
    const r = Number(body.rating)
    if (Number.isInteger(r) && r >= 1 && r <= 5) update.rating = r
  }
  if (body.review_text !== undefined) update.review_text = String(body.review_text).trim()
  if (body.manager_reply !== undefined) update.manager_reply = body.manager_reply?.trim() || null
  if (body.review_date !== undefined) update.review_date = body.review_date || undefined
  if (body.telegram_url !== undefined) update.telegram_url = body.telegram_url?.trim() || null
  if (body.is_published !== undefined) update.is_published = Boolean(body.is_published)
  if (body.sort_order !== undefined && Number.isFinite(Number(body.sort_order))) update.sort_order = Number(body.sort_order)

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Немає полів для оновлення' }, { status: 400 })
  }

  const { error } = await supabase.from('reviews').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidateTag('reviews-aggregate')
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await requireStaff()
  if (!supabase) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const { error } = await supabase.from('reviews').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidateTag('reviews-aggregate')
  return NextResponse.json({ ok: true })
}
