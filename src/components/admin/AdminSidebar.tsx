'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/admin/users',    label: 'Користувачі',  icon: 'group' },
  { href: '/admin/orders',   label: 'Замовлення',   icon: 'receipt_long' },
  { href: '/admin/promos',   label: 'Промокоди',    icon: 'local_offer' },
  { href: '/admin/products', label: 'Синк товарів', icon: 'sync' },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-56 shrink-0">
      <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px] mb-4 px-3">
        Адміністрування
      </p>
      <nav className="space-y-1">
        {NAV.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded font-label-caps text-label-caps uppercase tracking-widest text-[11px] transition-colors ${
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface-variant hover:text-primary hover:bg-primary/5'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
