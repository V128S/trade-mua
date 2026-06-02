import Link from 'next/link'
import type { Database, UserRole } from '@/lib/types/database.types'
import RoleSelect from '@/components/admin/RoleSelect'

type Profile = Database['public']['Tables']['profiles']['Row'] & { order_count?: number }

const ROLE_UA: Record<UserRole, string> = {
  customer: 'Клієнт',
  director: 'Директор',
  admin: 'Адмін',
}

export default function UsersTable({
  users,
  viewerIsAdmin,
  viewerId,
}: {
  users: Profile[]
  viewerIsAdmin: boolean
  viewerId: string | null
}) {
  if (users.length === 0) {
    return <p className="font-body-md text-body-md text-on-surface-variant py-8">Користувачів ще немає</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-card-border">
            {["Ім'я", 'Телефон', 'Дата реєстрації', 'Замовлень', 'Роль', ''].map(h => (
              <th key={h} className="pb-3 pr-4 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map(u => {
            const isSelf = u.id === viewerId
            return (
              <tr key={u.id} className="border-b border-card-border hover:bg-card/50 transition-colors">
                <td className="py-3 pr-4 font-body-md text-body-md text-on-surface">{u.full_name ?? '—'}</td>
                <td className="py-3 pr-4 font-body-md text-body-md text-on-surface-variant text-sm">{u.phone ?? '—'}</td>
                <td className="py-3 pr-4 font-label-caps text-label-caps text-on-surface-variant text-[11px]">
                  {new Date(u.created_at).toLocaleDateString('uk-UA')}
                </td>
                <td className="py-3 pr-4 font-technical-data text-technical-data text-on-surface">{u.order_count ?? 0}</td>
                <td className="py-3 pr-4">
                  {viewerIsAdmin && !isSelf ? (
                    <RoleSelect userId={u.id} current={u.role} />
                  ) : (
                    <span className="font-label-caps text-label-caps text-on-surface uppercase tracking-widest text-[11px]">
                      {ROLE_UA[u.role]}{isSelf ? ' (ви)' : ''}
                    </span>
                  )}
                </td>
                <td className="py-3">
                  <Link href={`/admin/users/${u.id}`} className="font-label-caps text-label-caps text-primary hover:underline uppercase tracking-widest text-[11px]">
                    Деталі
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
