import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role
  if (role !== 'admin' && role !== 'director') redirect('/')
  const isAdmin = role === 'admin'

  return (
    <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-10 pb-section-gap">
      <div className="flex items-center gap-3 mb-8">
        <span className="material-symbols-outlined text-primary text-[28px]">
          {isAdmin ? 'admin_panel_settings' : 'support_agent'}
        </span>
        <h1 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest">
          {isAdmin ? 'Адмін-панель' : 'Панель директора'}
        </h1>
        <span className="chip px-2 py-0.5 font-technical-data text-[10px] uppercase tracking-wider">
          {isAdmin ? 'Admin' : 'Director'}
        </span>
      </div>
      <div className="flex gap-8 items-start">
        <AdminSidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  )
}
