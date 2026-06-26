import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { requireStaff } from '@/lib/supabase/admin'
import type { Database } from '@/lib/types/database.types'

type ReviewInsert = Database['public']['Tables']['reviews']['Insert']

export async function POST(request: NextRequest) {
  const supabase = await requireStaff()
  if (!supabase) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const authorName = String(body.author_name ?? '').trim()
  const reviewText = String(body.review_text ?? '').trim()
  if (!authorName) return NextResponse.json({ error: "Вкажіть ім'я" }, { status: 400 })
  if (!reviewText) return NextResponse.json({ error: 'Вкажіть текст відгуку' }, { status: 400 })

  const rating = Number(body.rating)
  const row: ReviewInsert = {
    author_name: authorName,
    author_location: body.author_location?.trim() || null,
    rating: Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : 5,
    review_text: reviewText,
    manager_reply: body.manager_reply?.trim() || null,
    review_date: body.review_date || undefined,
    telegram_url: body.telegram_url?.trim() || null,
    is_published: body.is_published === undefined ? true : Boolean(body.is_published),
    sort_order: Number.isFinite(Number(body.sort_order)) ? Number(body.sort_order) : 0,
  }

  const { data, error } = await supabase.from('reviews').insert(row).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidateTag('reviews-aggregate')
  return NextResponse.json(data, { status: 201 })
}
