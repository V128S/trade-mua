'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

export default function OrdersPagination({
  page,
  totalPages,
}: {
  page: number
  totalPages: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  function go(p: number) {
    const next = new URLSearchParams(params.toString())
    next.set('page', String(p))
    router.push(`${pathname}?${next.toString()}`)
  }

  return (
    <div className="flex items-center gap-3 mt-6">
      <button
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        className="btn-ghost px-4 py-2 rounded text-sm disabled:opacity-40"
      >
        ← Попередня
      </button>
      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">
        {page} / {totalPages}
      </span>
      <button
        onClick={() => go(page + 1)}
        disabled={page >= totalPages}
        className="btn-ghost px-4 py-2 rounded text-sm disabled:opacity-40"
      >
        Наступна →
      </button>
    </div>
  )
}
