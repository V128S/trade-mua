import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OrderList from '@/components/dashboard/OrderList'
import RoleSelect from '@/components/admin/RoleSelect'

type Props = { params: Promise<{ id: string }> }

export default async function AdminUserDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle()
  if (!profile) notFound()

  // Only admins may reassign roles; directors see the role as read-only text.
  const { data: { user: viewer } } = await supabase.auth.getUser()
  const { data: viewerProfile } = viewer
    ? await supabase.from('profiles').select('role').eq('id', viewer.id).maybeSingle()
    : { data: null }
  const viewerIsAdmin = viewerProfile?.role === 'admin'
  const isSelf = viewer?.id === id

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div className="bg-card border-card rounded-lg p-6 space-y-3">
        <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest text-base">
          {profile.full_name ?? 'Без імені'}
        </h2>
        {[
          { label: 'Телефон', value: profile.phone },
          { label: 'Зареєстровано', value: new Date(profile.created_at).toLocaleDateString('uk-UA') },
        ].map(({ label, value }) => (
          <div key={label} className="flex gap-4">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px] w-32">{label}</span>
            <span className="font-body-md text-body-md text-on-surface text-sm">{value ?? '—'}</span>
          </div>
        ))}
        <div className="flex gap-4 items-center">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px] w-32">Роль</span>
          {viewerIsAdmin && !isSelf ? (
            <RoleSelect userId={profile.id} current={profile.role} />
          ) : (
            <span className="font-body-md text-body-md text-on-surface text-sm">
              {profile.role}{isSelf && viewerIsAdmin ? ' (ви)' : ''}
            </span>
          )}
        </div>
      </div>
      <div>
        <h3 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest text-sm mb-4">
          Замовлення ({(orders ?? []).length})
        </h3>
        <OrderList orders={orders ?? []} />
      </div>
    </div>
  )
}
