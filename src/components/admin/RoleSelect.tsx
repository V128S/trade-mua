'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { UserRole } from '@/lib/types/database.types'

const ROLES: UserRole[] = ['customer', 'manager', 'admin']
const ROLE_UA: Record<UserRole, string> = {
  customer: 'Клієнт',
  manager: 'Менеджер',
  admin: 'Адмін',
}

// Admin-only role assignment. Rendered on the user detail page when the viewer
// is an admin; managers never see it (and the API rejects them anyway).
export default function RoleSelect({ userId, current }: { userId: string; current: UserRole }) {
  const router = useRouter()
  const [role, setRole] = useState<UserRole>(current)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function change(next: UserRole) {
    const prev = role
    setRole(next)
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: next }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setRole(prev)
        setError(data.error ?? 'Помилка збереження')
        return
      }
      router.refresh()
    } catch {
      setRole(prev)
      setError('Помилка мережі')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <select
        value={role}
        disabled={saving}
        onChange={e => change(e.target.value as UserRole)}
        className="bg-surface border border-card-border rounded px-2 py-1 font-label-caps text-label-caps text-on-surface uppercase tracking-widest text-[11px] focus:outline-none focus:border-primary/60 disabled:opacity-50"
      >
        {ROLES.map(r => (
          <option key={r} value={r}>{ROLE_UA[r]}</option>
        ))}
      </select>
      {error && <span className="font-label-caps text-[10px] text-red-400 uppercase tracking-widest">{error}</span>}
    </div>
  )
}
