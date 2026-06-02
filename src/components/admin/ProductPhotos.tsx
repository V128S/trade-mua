'use client'

import { useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export type PhotoProduct = {
  id: string
  name: string
  brand: string
  adminUrl: string | null   // uploaded photo (deletable)
  baseUrl: string | null    // Sheet URL or name→file mapping fallback
}

const ACCEPT = 'image/png,image/jpeg,image/webp'
const MAX_BYTES = 5 * 1024 * 1024

function Row({ product }: { product: PhotoProduct }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [adminUrl, setAdminUrl] = useState<string | null>(product.adminUrl)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const preview = adminUrl ?? product.baseUrl

  async function upload(file: File) {
    setError(null)
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError('Лише PNG, JPG або WEBP'); return
    }
    if (file.size > MAX_BYTES) { setError('Файл більший за 5 МБ'); return }

    setBusy(true)
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch(`/api/admin/products/${product.id}/photo`, { method: 'POST', body })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? 'Помилка завантаження'); return }
      setAdminUrl(data.url)
      router.refresh()
    } catch {
      setError('Помилка мережі')
    } finally {
      setBusy(false)
    }
  }

  async function removePhoto() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/products/${product.id}/photo`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? 'Помилка видалення'); return }
      setAdminUrl(null)
      router.refresh()
    } catch {
      setError('Помилка мережі')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-card border-card rounded-lg p-4 flex items-center gap-4">
      {/* Preview */}
      <div className="relative w-16 h-16 rounded bg-surface border border-card-border shrink-0 overflow-hidden flex items-center justify-center">
        {preview ? (
          <Image src={preview} alt={product.name} fill sizes="64px" className="object-contain p-1" unoptimized />
        ) : (
          <span className="material-symbols-outlined text-outline-variant text-[28px]">memory</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-technical-data text-technical-data text-on-surface truncate">{product.name}</p>
        <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mt-0.5">
          {adminUrl ? 'Завантажено в адмінці' : product.baseUrl ? 'З таблиці / за назвою' : 'Без фото'}
        </p>
        {error && <p className="font-label-caps text-[10px] text-red-400 uppercase tracking-widest mt-0.5">{error}</p>}
      </div>

      {/* Drop zone + actions */}
      <label
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault(); setDragOver(false)
          const f = e.dataTransfer.files?.[0]; if (f) upload(f)
        }}
        className={`shrink-0 cursor-pointer rounded border border-dashed px-4 py-2 font-label-caps text-label-caps uppercase tracking-widest text-[10px] transition-colors ${
          dragOver ? 'border-primary text-primary bg-primary/5' : 'border-card-border text-on-surface-variant hover:border-primary/40 hover:text-primary'
        } ${busy ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = '' }}
        />
        {busy ? 'Зачекайте…' : adminUrl ? 'Замінити' : 'Перетягніть / виберіть'}
      </label>

      {adminUrl && !busy && (
        <button
          type="button"
          onClick={removePhoto}
          className="shrink-0 font-label-caps text-[10px] text-on-surface-variant hover:text-red-400 uppercase tracking-widest transition-colors"
        >
          Видалити
        </button>
      )}
    </div>
  )
}

export default function ProductPhotos({ products }: { products: PhotoProduct[] }) {
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter(p => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))
  }, [products, query])

  return (
    <div className="space-y-4">
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Пошук за назвою або SKU…"
        className="w-full bg-surface border border-card-border rounded px-3 py-2 font-body-md text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary/60"
      />
      {visible.length === 0 ? (
        <p className="font-body-md text-body-md text-on-surface-variant py-8">Нічого не знайдено</p>
      ) : (
        <div className="space-y-3">
          {visible.map(p => <Row key={p.id} product={p} />)}
        </div>
      )}
    </div>
  )
}
