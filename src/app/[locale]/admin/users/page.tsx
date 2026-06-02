import { createClient } from '@/lib/supabase/server'
import UsersTable from '@/components/admin/UsersTable'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  // Only admins may reassign roles; directors see roles as read-only text.
  const { data: { user: viewer } } = await supabase.auth.getUser()
  const { data: viewerProfile } = viewer
    ? await supabase.from('profiles').select('role').eq('id', viewer.id).maybeSingle()
    : { data: null }
  const viewerIsAdmin = viewerProfile?.role === 'admin'

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: orderCounts } = await supabase
    .from('orders')
    .select('user_id')

  const countMap: Record<string, number> = {}
  for (const row of orderCounts ?? []) {
    countMap[row.user_id] = (countMap[row.user_id] ?? 0) + 1
  }

  const users = (profiles ?? []).map(p => ({
    ...p,
    order_count: countMap[p.id] ?? 0,
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest text-base">
          Користувачі ({users.length})
        </h2>
      </div>
      <UsersTable users={users} viewerIsAdmin={viewerIsAdmin} viewerId={viewer?.id ?? null} />
    </div>
  )
}
