'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordForm() {
  const t = useTranslations('auth')
  const router = useRouter()
  // useSearchParams is intentionally kept from next/navigation (locale-unaware is fine for query params)
  const [step, setStep] = useState<'request' | 'update'>('request')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?next=/auth/reset-password`,
    })
    setLoading(false)
    if (error) {
      setError(t('errorResetGeneric'))
      return
    }
    setMessage(t('successResetSent'))
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setError(t('errorMinPassword')); return }
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError(t('errorUpdatePassword')); return }
    router.push('/dashboard')
  }

  if (message) {
    return (
      <div className="text-center space-y-3">
        <span className="material-symbols-outlined text-primary text-[48px]">mark_email_read</span>
        <p className="font-body-md text-body-md text-on-surface-variant">{message}</p>
      </div>
    )
  }

  if (step === 'update') {
    return (
      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest block mb-1.5 text-[11px]">
            {t('newPasswordLabel')}
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder={t('passwordPlaceholder')}
            className="w-full bg-surface border border-[#2e2d2b] rounded px-4 py-2.5 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary/60 transition-colors"
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full py-3 rounded font-label-caps text-label-caps uppercase tracking-widest disabled:opacity-50">
          {loading ? t('submittingSavePassword') : t('submitSavePassword')}
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={handleRequest} className="space-y-4">
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
          className="w-full bg-surface border border-[#2e2d2b] rounded px-4 py-2.5 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary/60 transition-colors"
        />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full py-3 rounded font-label-caps text-label-caps uppercase tracking-widest disabled:opacity-50">
        {loading ? t('submittingReset') : t('submitReset')}
      </button>
      <button
        type="button"
        onClick={() => setStep('update')}
        className="w-full text-center font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[11px] hover:text-primary transition-colors"
      >
        {t('hasResetLink')}
      </button>
    </form>
  )
}
