'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Database } from '@/lib/types/database.types'

type Promo = Database['public']['Tables']['promo_codes']['Row']

export default function PromosManager({ promos }: { promos: Promo[] }) {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [pct, setPct] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [expires, setExpires] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function createPromo(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await fetch('/api/admin/promos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, discount_pct: pct, max_uses: maxUses || null, expires_at: expires || null }),
    })
    setLoading(false)
    if (!res.ok) { setError((await res.json()).error); return }
    setCode(''); setPct(''); setMaxUses(''); setExpires('')
    router.refresh()
  }

  async function toggleActive(promo: Promo) {
    await fetch(`/api/admin/promos/${promo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !promo.is_active }),
    })
    router.refresh()
  }

  async function deletePromo(id: string) {
    if (!confirm('Видалити промокод?')) return
    await fetch(`/api/admin/promos/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div className="space-y-8">
      <div className="bg-card border-card rounded-lg p-6">
        <h3 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest text-sm mb-5">
          Новий промокод
        </h3>
        <form onSubmit={createPromo} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Код', value: code, setter: setCode, placeholder: 'SUMMER10', required: true },
            { label: 'Знижка %', value: pct, setter: setPct, placeholder: '10', required: true },
            { label: 'Ліміт використань', value: maxUses, setter: setMaxUses, placeholder: 'Без ліміту', required: false },
          ].map(({ label, value, setter, placeholder, required }) => (
            <div key={label}>
              <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest block mb-1.5 text-[10px]">
                {label}
              </label>
              <input
                value={value}
                onChange={e => setter(e.target.value)}
                required={required}
                placeholder={placeholder}
                className="w-full bg-surface border border-card-border rounded px-3 py-2 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary/60 transition-colors text-sm"
              />
            </div>
          ))}
          <div>
            <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest block mb-1.5 text-[10px]">Діє до</label>
            <input type="date" value={expires} onChange={e => setExpires(e.target.value)}
              className="w-full bg-surface border border-card-border rounded px-3 py-2 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary/60 transition-colors text-sm" />
          </div>
          {error && <p className="col-span-full text-red-400 text-sm">{error}</p>}
          <div className="col-span-full">
            <button type="submit" disabled={loading} className="btn-primary py-2 px-6 rounded font-label-caps text-label-caps uppercase tracking-widest text-sm disabled:opacity-50">
              {loading ? 'Створення...' : 'Створити промокод'}
            </button>
          </div>
        </form>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-card-border">
              {['Код', 'Знижка', 'Використано', 'Закінчується', 'Статус', ''].map(h => (
                <th key={h} className="pb-3 pr-4 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {promos.map(p => (
              <tr key={p.id} className="border-b border-card-border">
                <td className="py-3 pr-4 font-technical-data text-technical-data text-primary">{p.code}</td>
                <td className="py-3 pr-4 font-body-md text-body-md text-on-surface">{p.discount_pct}%</td>
                <td className="py-3 pr-4 font-body-md text-body-md text-on-surface-variant text-sm">{p.uses_count}{p.max_uses ? ` / ${p.max_uses}` : ''}</td>
                <td className="py-3 pr-4 font-body-md text-body-md text-on-surface-variant text-sm">
                  {p.expires_at ? new Date(p.expires_at).toLocaleDateString('uk-UA') : '—'}
                </td>
                <td className="py-3 pr-4">
                  <button onClick={() => toggleActive(p)}
                    className={`chip px-2 py-0.5 font-technical-data text-[10px] uppercase tracking-wider cursor-pointer ${p.is_active ? 'bg-green-100 text-green-700 dark:bg-[#1a2b1a] dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-[#2b1a1a] dark:text-red-400'}`}>
                    {p.is_active ? 'Активний' : 'Деактивовано'}
                  </button>
                </td>
                <td className="py-3">
                  <button onClick={() => deletePromo(p.id)} className="text-on-surface-variant hover:text-red-400 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </td>
              </tr>
            ))}
            {promos.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center font-body-md text-body-md text-on-surface-variant">Промокодів ще немає</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
