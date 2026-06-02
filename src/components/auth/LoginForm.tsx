'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import PasswordInput from '@/components/auth/PasswordInput'

export default function LoginForm() {
  const t = useTranslations('auth')
  const locale = useLocale()
  const searchParams = useSearchParams()
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
      setError(t('errorInvalidCredentials'))
      setLoading(false)
      return
    }

    // Hard redirect ensures browser sends fresh session cookies with the next request
    const redirect = searchParams.get('redirect')
    // Only allow same-origin relative paths (reject protocol-relative "//host")
    const safe = redirect && redirect.startsWith('/') && !redirect.startsWith('//')
    window.location.href = safe ? redirect : (locale === 'ru' ? '/ru/dashboard' : '/dashboard')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest block mb-1.5 text-[11px]">
          {t('emailLabel')}
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          placeholder={t('emailPlaceholder')}
          className="w-full bg-surface border border-card-border rounded px-4 py-2.5 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary/60 transition-colors"
        />
      </div>
      <div>
        <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest block mb-1.5 text-[11px]">
          {t('passwordLabel')}
        </label>
        <PasswordInput
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          placeholder={t('passwordPlaceholder')}
          className="w-full bg-surface border border-card-border rounded px-4 py-2.5 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary/60 transition-colors"
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
        {loading ? t('submittingLogin') : t('submitLogin')}
      </button>
      <div className="flex items-center justify-between font-label-caps text-label-caps text-on-surface-variant text-[11px] uppercase tracking-widest">
        <Link href="/register" className="hover:text-primary transition-colors">
          {t('registerLink')}
        </Link>
        <Link href="/auth/reset-password" className="hover:text-primary transition-colors">
          {t('forgotPassword')}
        </Link>
      </div>
    </form>
  )
}
