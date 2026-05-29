import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OrderList from '@/components/dashboard/OrderList'

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <OrderList orders={orders ?? []} />
}
