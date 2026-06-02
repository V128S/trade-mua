'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import PasswordInput from '@/components/auth/PasswordInput'

const labelClass =
  'font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest block mb-1.5 text-[11px]'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const HAS_LETTER = /[a-zA-Zа-яА-ЯіїєґІЇЄҐ]/
const HAS_DIGIT = /\d/

// Format up to 9 national digits as "XX XXX XX XX" (Ukrainian +380 numbers).
function formatPhone(digits: string) {
  const d = digits.slice(0, 9)
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(' ')
}

// Lightweight password strength: 0 (empty) … 3 (strong).
function passwordScore(pw: string) {
  if (!pw) return 0
  let s = 0
  if (pw.length >= 8) s++
  if (HAS_LETTER.test(pw) && HAS_DIGIT.test(pw)) s++
  if (pw.length >= 12 || /[^a-zA-Z0-9]/.test(pw)) s++
  return s
}

type FieldName = 'firstName' | 'lastName' | 'phone' | 'email' | 'password'

export default function RegisterForm() {
  const t = useTranslations('auth')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneDigits, setPhoneDigits] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState<Record<FieldName, boolean>>({
    firstName: false, lastName: false, phone: false, email: false, password: false,
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  // Per-field validation. firstName / email / password are required; lastName is
  // optional; phone is optional but must be complete when provided.
  const errors: Record<FieldName, string> = {
    firstName: !firstName.trim() ? t('errorRequired') : '',
    lastName: '',
    phone: phoneDigits.length > 0 && phoneDigits.length !== 9 ? t('errorInvalidPhone') : '',
    email: !email ? t('errorRequired') : !EMAIL_RE.test(email) ? t('errorInvalidEmail') : '',
    password: !password
      ? t('errorRequired')
      : password.length < 8
        ? t('errorShortPassword')
        : !HAS_LETTER.test(password) || !HAS_DIGIT.test(password)
          ? t('errorWeakPassword')
          : '',
  }

  const showErr = (f: FieldName) => touched[f] && !!errors[f]
  const markTouched = (f: FieldName) => setTouched(prev => (prev[f] ? prev : { ...prev, [f]: true }))
  const borderCls = (f: FieldName) =>
    showErr(f) ? 'border-red-400/70 focus:border-red-400' : 'border-card-border focus:border-primary/60'
  const inputCls = (f: FieldName) =>
    `w-full bg-surface border rounded px-4 py-2.5 font-body-md text-body-md text-on-surface focus:outline-none transition-colors ${borderCls(f)}`

  // Any non-empty password is at least "weak" so the meter always reads sensibly.
  const score = password ? Math.max(passwordScore(password), 1) : 0
  const strength = [
    { label: '', bar: 'bg-outline-variant/30', text: '' },
    { label: t('passwordWeak'), bar: 'bg-red-400', text: 'text-red-400' },
    { label: t('passwordMedium'), bar: 'bg-amber-400', text: 'text-amber-400' },
    { label: t('passwordStrong'), bar: 'bg-primary', text: 'text-primary' },
  ][score]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setTouched({ firstName: true, lastName: true, phone: true, email: true, password: true })

    if (Object.values(errors).some(Boolean)) return

    setLoading(true)

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()
    const phone = phoneDigits.length === 9 ? `+380${phoneDigits}` : ''

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone,
        },
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

    // With Supabase email-enumeration protection enabled, signing up with an
    // already-registered address returns no error and sends no email — instead
    // the returned user has an empty `identities` array. Detect that here so the
    // user gets a clear message instead of waiting for an email that never comes.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setError(t('errorEmailExists'))
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

  const fieldError = (name: FieldName) =>
    showErr(name) ? (
      <p className="mt-1 font-label-caps text-[10px] text-red-400 uppercase tracking-widest">{errors[name]}</p>
    ) : null

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Name — first (required) + last (optional) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>{t('firstNameLabel')} <span className="text-primary">*</span></label>
          <input
            type="text"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            onBlur={() => markTouched('firstName')}
            required
            placeholder={t('firstNamePlaceholder')}
            className={inputCls('firstName')}
          />
          {fieldError('firstName')}
        </div>
        <div>
          <label className={labelClass}>{t('lastNameLabel')}</label>
          <input
            type="text"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            placeholder={t('lastNamePlaceholder')}
            className={inputCls('lastName')}
          />
        </div>
      </div>

      {/* Phone — fixed +380 prefix (optional) */}
      <div>
        <label className={labelClass}>{t('phoneLabel')}</label>
        <div className={`flex items-stretch bg-surface border rounded overflow-hidden transition-colors ${
          showErr('phone') ? 'border-red-400/70 focus-within:border-red-400' : 'border-card-border focus-within:border-primary/60'
        }`}>
          <span className="flex items-center px-3 font-body-md text-body-md text-on-surface-variant border-r border-card-border select-none">
            +380
          </span>
          <input
            type="tel"
            inputMode="numeric"
            value={formatPhone(phoneDigits)}
            onChange={e => setPhoneDigits(e.target.value.replace(/\D/g, '').slice(0, 9))}
            onBlur={() => markTouched('phone')}
            placeholder="00 000 00 00"
            className="flex-1 min-w-0 bg-transparent px-3 py-2.5 font-body-md text-body-md text-on-surface focus:outline-none"
          />
        </div>
        {fieldError('phone')}
      </div>

      {/* Email (required) */}
      <div>
        <label className={labelClass}>{t('emailLabel')} <span className="text-primary">*</span></label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onBlur={() => markTouched('email')}
          required
          placeholder={t('emailPlaceholder')}
          className={inputCls('email')}
        />
        {fieldError('email')}
      </div>

      {/* Password (required) + strength */}
      <div>
        <label className={labelClass}>{t('passwordLabel')} <span className="text-primary">*</span></label>
        <PasswordInput
          value={password}
          onChange={e => setPassword(e.target.value)}
          onBlur={() => markTouched('password')}
          required
          placeholder={t('passwordPlaceholder')}
          className={inputCls('password')}
        />
        {password ? (
          <div className="mt-2">
            <div className="flex gap-1">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${score >= i ? strength.bar : 'bg-outline-variant/30'}`}
                />
              ))}
            </div>
            {showErr('password') ? (
              fieldError('password')
            ) : (
              <p className={`mt-1 font-label-caps text-[10px] uppercase tracking-widest ${strength.text}`}>
                {strength.label}
              </p>
            )}
          </div>
        ) : showErr('password') ? (
          fieldError('password')
        ) : (
          <p className="mt-1.5 font-label-caps text-[10px] text-on-surface-variant/70 uppercase tracking-widest">
            {t('passwordHint')}
          </p>
        )}
      </div>

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
