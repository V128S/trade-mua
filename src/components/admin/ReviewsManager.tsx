'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Database } from '@/lib/types/database.types'

type Review = Database['public']['Tables']['reviews']['Row']

const EMPTY = {
  author_name: '',
  author_location: '',
  rating: '5',
  review_text: '',
  manager_reply: '',
  review_date: '',
  telegram_url: '',
}

export default function ReviewsManager({ reviews }: { reviews: Review[] }) {
  const router = useRouter()
  const [form, setForm] = useState({ ...EMPTY })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  function reset() { setForm({ ...EMPTY }); setEditingId(null); setError(null) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const payload = {
      author_name: form.author_name,
      author_location: form.author_location,
      rating: Number(form.rating),
      review_text: form.review_text,
      manager_reply: form.manager_reply,
      review_date: form.review_date || undefined,
      telegram_url: form.telegram_url,
    }
    const url = editingId ? `/api/admin/reviews/${editingId}` : '/api/admin/reviews'
    const res = await fetch(url, {
      method: editingId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setLoading(false)
    if (!res.ok) { setError((await res.json().catch(() => ({}))).error ?? 'Помилка'); return }
    reset()
    router.refresh()
  }

  function startEdit(r: Review) {
    setEditingId(r.id)
    setError(null)
    setForm({
      author_name: r.author_name,
      author_location: r.author_location ?? '',
      rating: String(r.rating),
      review_text: r.review_text,
      manager_reply: r.manager_reply ?? '',
      review_date: r.review_date ?? '',
      telegram_url: r.telegram_url ?? '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function togglePublish(r: Review) {
    await fetch(`/api/admin/reviews/${r.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: !r.is_published }),
    })
    router.refresh()
  }

  async function remove(id: string) {
    if (!confirm('Видалити відгук?')) return
    await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' })
    if (editingId === id) reset()
    router.refresh()
  }

  const inputCls = 'w-full bg-surface border border-card-border rounded px-3 py-2 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary/60 transition-colors text-sm'
  const labelCls = 'font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest block mb-1.5 text-[10px]'

  return (
    <div className="space-y-8">
      {/* Form */}
      <div className="bg-card border-card rounded-lg p-6">
        <h3 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest text-sm mb-5">
          {editingId ? 'Редагувати відгук' : 'Новий відгук'}
        </h3>
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Ім&apos;я *</label>
            <input value={form.author_name} onChange={set('author_name')} required placeholder="Олександр" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Місто / локація</label>
            <input value={form.author_location} onChange={set('author_location')} placeholder="Київ" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Рейтинг</label>
            <select value={form.rating} onChange={set('rating')} className={inputCls}>
              {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} ★</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Дата</label>
            <input type="date" value={form.review_date} onChange={set('review_date')} className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Текст відгуку *</label>
            <textarea value={form.review_text} onChange={set('review_text')} required rows={3} className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Відповідь менеджера</label>
            <textarea value={form.manager_reply} onChange={set('manager_reply')} rows={2} className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Посилання на Telegram</label>
            <input value={form.telegram_url} onChange={set('telegram_url')} placeholder="https://t.me/..." className={inputCls} />
          </div>
          {error && <p className="col-span-full text-red-400 text-sm">{error}</p>}
          <div className="col-span-full flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary py-2 px-6 rounded font-label-caps text-label-caps uppercase tracking-widest text-sm disabled:opacity-50">
              {loading ? 'Збереження…' : editingId ? 'Зберегти' : 'Додати відгук'}
            </button>
            {editingId && (
              <button type="button" onClick={reset} className="btn-ghost py-2 px-6 rounded font-label-caps text-label-caps uppercase tracking-widest text-sm">
                Скасувати
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="font-body-md text-body-md text-on-surface-variant py-8">Відгуків ще немає</p>
        ) : reviews.map(r => (
          <div key={r.id} className={`bg-card border-card rounded-lg p-5 space-y-3 ${r.is_published ? '' : 'opacity-60'}`}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-technical-data text-technical-data text-on-surface">{r.author_name}</span>
                  <span className="font-label-caps text-[10px] text-primary tracking-wider">{'★'.repeat(r.rating)}</span>
                </div>
                <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mt-0.5">
                  {[r.author_location, new Date(r.review_date).toLocaleDateString('uk-UA')].filter(Boolean).join(' · ')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => togglePublish(r)}
                  className={`chip px-2 py-0.5 font-technical-data text-[10px] uppercase tracking-wider cursor-pointer ${r.is_published ? 'bg-green-100 text-green-700 dark:bg-[#1a2b1a] dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-[#2b1a1a] dark:text-red-400'}`}>
                  {r.is_published ? 'Опубліковано' : 'Приховано'}
                </button>
                <button onClick={() => startEdit(r)} className="text-on-surface-variant hover:text-primary transition-colors" title="Редагувати">
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
                <button onClick={() => remove(r.id)} className="text-on-surface-variant hover:text-red-400 transition-colors" title="Видалити">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
            <p className="font-body-md text-body-md text-on-surface">{r.review_text}</p>
            {r.manager_reply && (
              <div className="border-l-2 border-primary/40 pl-3">
                <p className="font-label-caps text-[10px] text-primary uppercase tracking-widest">Відповідь менеджера</p>
                <p className="font-body-md text-body-md text-on-surface-variant text-sm mt-0.5">{r.manager_reply}</p>
              </div>
            )}
            {r.telegram_url && (
              <a href={r.telegram_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-label-caps text-[10px] text-on-surface-variant hover:text-primary uppercase tracking-widest transition-colors">
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                Telegram
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
