import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database.types'

export type Review = Database['public']['Tables']['reviews']['Row']

// Published reviews for the homepage. RLS (reviews_public_read) already limits
// anon reads to is_published, but we filter explicitly for clarity + ordering.
export async function getPublishedReviews(limit = 8): Promise<Review[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('is_published', true)
    .order('sort_order', { ascending: false })
    .order('review_date', { ascending: false })
    .limit(limit)
  if (error || !data) return []
  return data
}
