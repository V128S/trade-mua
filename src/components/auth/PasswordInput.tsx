'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>

// Password field with a show/hide (eye) toggle. Forwards all input props so it
// drops into existing forms unchanged; the right padding is set inline to clear
// the button regardless of Tailwind class ordering.
export default function PasswordInput({ className, style, ...props }: Props) {
  const t = useTranslations('auth')
  const [show, setShow] = useState(false)

  return (
    <div className="relative">
      <input
        {...props}
        type={show ? 'text' : 'password'}
        className={className}
        style={{ ...style, paddingRight: '2.75rem' }}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        aria-label={show ? t('hidePassword') : t('showPassword')}
        aria-pressed={show}
        tabIndex={-1}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 grid place-items-center text-on-surface-variant hover:text-primary transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">
          {show ? 'visibility_off' : 'visibility'}
        </span>
      </button>
    </div>
  )
}
