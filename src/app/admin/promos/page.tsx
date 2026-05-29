import { createClient } from '@/lib/supabase/server'
import PromosManager from '@/components/admin/PromosManager'

export default async function AdminPromosPage() {
  const supabase = await createClient()
  const { data: promos } = await supabase
    .from('promo_codes')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest text-base mb-6">
        Промокоди
      </h2>
      <PromosManager promos={promos ?? []} />
    </div>
  )
}
