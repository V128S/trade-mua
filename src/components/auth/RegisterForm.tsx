'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterForm() {
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
      setError('Пароль мінімум 6 символів')
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
        ? 'Цей email вже зареєстрований'
        : 'Помилка реєстрації. Спробуйте ще раз.')
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
          Перевірте пошту
        </p>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Ми надіслали лист підтвердження на{' '}
          <strong className="text-on-surface">{email}</strong>.
          Перейдіть за посиланням у листі для активації акаунту.
        </p>
        <Link
          href="/login"
          className="inline-block btn-ghost py-2 px-6 rounded font-label-caps text-label-caps uppercase tracking-widest text-sm mt-4"
        >
          На сторінку входу
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {[
        { label: "Ім'я та прізвище", value: fullName, setter: setFullName, type: 'text', placeholder: 'Іван Петренко' },
        { label: 'Телефон', value: phone, setter: setPhone, type: 'tel', placeholder: '+380501234567' },
        { label: 'Email', value: email, setter: setEmail, type: 'email', placeholder: 'your@email.com' },
        { label: 'Пароль', value: password, setter: setPassword, type: 'password', placeholder: '••••••••' },
      ].map(({ label, value, setter, type, placeholder }) => (
        <div key={label}>
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
        {loading ? 'Реєстрація...' : 'Зареєструватись'}
      </button>
      <p className="text-center font-label-caps text-label-caps text-on-surface-variant text-[11px] uppercase tracking-widest">
        Вже є акаунт?{' '}
        <Link href="/login" className="text-primary hover:underline">
          Увійти
        </Link>
      </p>
    </form>
  )
}
