import { createClient } from '@/lib/supabase/server'
import ReviewsManager from '@/components/admin/ReviewsManager'

export default async function AdminReviewsPage() {
  const supabase = await createClient()
  // Staff RLS lets admins/managers read unpublished reviews too.
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .order('sort_order', { ascending: false })
    .order('review_date', { ascending: false })

  return (
    <div>
      <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest text-base mb-6">
        Відгуки ({(reviews ?? []).length})
      </h2>
      <ReviewsManager reviews={reviews ?? []} />
    </div>
  )
}
