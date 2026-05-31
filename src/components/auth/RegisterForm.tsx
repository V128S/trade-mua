'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RegisterForm() {
  const t = useTranslations('auth')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      setError(t('errorShortPassword'))
      return
    }
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message === 'User already registered'
        ? t('errorEmailExists')
        : t('errorRegisterGeneric'))
      setLoading(false)
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <span className="material-symbols-outlined text-primary text-[48px]">mark_email_read</span>
        <p className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest">
          {t('successCheckEmail')}
        </p>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t.rich('successCheckEmailDesc', {
            email,
            strong: (chunks) => <strong className="text-on-surface">{chunks}</strong>,
          })}
        </p>
        <Link
          href="/login"
          className="inline-block btn-ghost py-2 px-6 rounded font-label-caps text-label-caps uppercase tracking-widest text-sm mt-4"
        >
          {t('backToLogin')}
        </Link>
      </div>
    )
  }

  const fields = [
    { key: 'fullName', label: t('fullNameLabel'), value: fullName, setter: setFullName, type: 'text', placeholder: t('fullNamePlaceholder') },
    { key: 'phone', label: t('phoneLabel'), value: phone, setter: setPhone, type: 'tel', placeholder: t('phonePlaceholder') },
    { key: 'email', label: t('emailLabel'), value: email, setter: setEmail, type: 'email', placeholder: t('emailPlaceholder') },
    { key: 'password', label: t('passwordLabel'), value: password, setter: setPassword, type: 'password', placeholder: t('passwordPlaceholder') },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map(({ key, label, value, setter, type, placeholder }) => (
        <div key={key}>
          <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest block mb-1.5 text-[11px]">
            {label}
          </label>
          <input
            type={type}
            value={value}
            onChange={e => setter(e.target.value)}
            required
            placeholder={placeholder}
            className="w-full bg-surface border border-[#2e2d2b] rounded px-4 py-2.5 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary/60 transition-colors"
          />
        </div>
      ))}
      {error && <p className="font-body-md text-body-md text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full py-3 rounded font-label-caps text-label-caps uppercase tracking-widest disabled:opacity-50"
      >
        {loading ? t('submittingRegister') : t('submitRegister')}
      </button>
      <p className="text-center font-label-caps text-label-caps text-on-surface-variant text-[11px] uppercase tracking-widest">
        {t('noAccount')}{' '}
        <Link href="/login" className="text-primary hover:underline">
          {t('loginLink')}
        </Link>
      </p>
    </form>
  )
}
