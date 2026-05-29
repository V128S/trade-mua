import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-10 pb-section-gap">
      <div className="flex items-center gap-3 mb-8">
        <span className="material-symbols-outlined text-primary text-[28px]">person</span>
        <h1 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest">
          Особистий кабінет
        </h1>
      </div>
      <nav className="flex gap-1 mb-8 border-b border-[#2e2d2b]">
        {[
          { href: '/dashboard/profile', label: 'Профіль', icon: 'manage_accounts' },
          { href: '/dashboard/orders', label: 'Замовлення', icon: 'receipt_long' },
        ].map(tab => (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex items-center gap-2 px-5 py-3 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[11px] hover:text-primary border-b-2 border-transparent hover:border-primary transition-colors -mb-px"
          >
            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  )
}
