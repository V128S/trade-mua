import { unstable_cache } from 'next/cache'
import { createClient as createAnon } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database.types'

export type Review = Database['public']['Tables']['reviews']['Row']

async function _getReviewsAggregate(): Promise<{ count: number; average: number } | null> {
  // Reviews are publicly readable — use the anon client so this result can be
  // safely cached across requests (the SSR client reads cookies and cannot be
  // used inside unstable_cache).
  const supabase = createAnon<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('is_published', true)
  if (error || !data || data.length === 0) return null
  const sum = data.reduce((s, r) => s + Number(r.rating), 0)
  return { count: data.length, average: Math.round((sum / data.length) * 10) / 10 }
}

// Cached for 1 hour. Invalidate via revalidateTag('reviews-aggregate') from the
// admin reviews route when a review is published or unpublished.
export const getReviewsAggregate = unstable_cache(
  _getReviewsAggregate,
  ['reviews-aggregate'],
  { revalidate: 3600 },
)

export async function getPublishedReviews(limit = 8): Promise<Review[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reviews')
    .select('id, author_name, author_location, rating, review_text, manager_reply, review_date, telegram_url, is_published, sort_order, created_at')
    .eq('is_published', true)
    .order('sort_order', { ascending: false })
    .order('review_date', { ascending: false })
    .limit(limit)
  if (error || !data) return []
  return data
}
