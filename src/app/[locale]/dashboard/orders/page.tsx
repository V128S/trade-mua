import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OrderList from '@/components/dashboard/OrderList'

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { success } = await searchParams

  return (
    <>
      {success && (
        <div className="mb-6 bg-primary/10 border border-primary/30 rounded-lg px-5 py-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
          <p className="font-body-md text-body-md text-on-surface">
            Замовлення оформлено! Менеджер зв&apos;яжеться з вами найближчим часом.
          </p>
        </div>
      )}
      <OrderList orders={orders ?? []} />
    </>
  )
}
