'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Невірний email або пароль')
      setLoading(false)
      return
    }

    // Hard redirect ensures browser sends fresh session cookies with the next request
    window.location.href = '/dashboard'
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest block mb-1.5 text-[11px]">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          placeholder="your@email.com"
          className="w-full bg-surface border border-[#2e2d2b] rounded px-4 py-2.5 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary/60 transition-colors"
        />
      </div>
      <div>
        <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest block mb-1.5 text-[11px]">
          Пароль
        </label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          placeholder="••••••••"
          className="w-full bg-surface border border-[#2e2d2b] rounded px-4 py-2.5 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary/60 transition-colors"
        />
      </div>
      {error && (
        <p className="font-body-md text-body-md text-red-400 text-sm">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full py-3 rounded font-label-caps text-label-caps uppercase tracking-widest disabled:opacity-50 transition-opacity"
      >
        {loading ? 'Вхід...' : 'Увійти'}
      </button>
      <div className="flex items-center justify-between font-label-caps text-label-caps text-on-surface-variant text-[11px] uppercase tracking-widest">
        <Link href="/register" className="hover:text-primary transition-colors">
          Реєстрація
        </Link>
        <Link href="/auth/reset-password" className="hover:text-primary transition-colors">
          Забули пароль?
        </Link>
      </div>
    </form>
  )
}
