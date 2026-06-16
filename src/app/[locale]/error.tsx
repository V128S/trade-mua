'use client'
import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

// Segment error boundary: catches render/runtime errors inside the locale tree
// and offers a retry without a full reload. Must be a Client Component.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('errors')

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-8 px-margin-mobile md:px-margin-desktop">
      <span className="material-symbols-outlined text-outline-variant text-[96px]">error</span>
      <div className="space-y-3">
        <h1 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest text-lg">{t('errorTitle')}</h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-md">{t('errorDesc')}</p>
      </div>
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          type="button"
          onClick={reset}
          className="btn-primary py-4 px-8 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          {t('errorRetry')}
        </button>
        <Link href="/" className="btn-ghost py-4 px-8 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">home</span>
          {t('notFoundHome')}
        </Link>
      </div>
    </div>
  )
}
