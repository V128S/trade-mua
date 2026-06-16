'use client'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

// Localized 404 for notFound() thrown inside the [locale] segment (product,
// blog, asic, admin pages). Renders within the locale layout, so the navbar,
// footer and NextIntlClientProvider are all in place.
export default function NotFound() {
  const t = useTranslations('errors')
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-8 px-margin-mobile md:px-margin-desktop">
      <span className="material-symbols-outlined text-outline-variant text-[96px]">travel_explore</span>
      <div className="space-y-3">
        <h1 className="font-headline-md text-headline-md gold-text uppercase tracking-widest text-3xl">404</h1>
        <p className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest text-lg">{t('notFoundTitle')}</p>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-md">{t('notFoundDesc')}</p>
      </div>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link href="/" className="btn-primary py-4 px-8 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">home</span>
          {t('notFoundHome')}
        </Link>
        <Link href="/products" className="btn-ghost py-4 px-8 rounded font-label-caps text-label-caps uppercase tracking-widest flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">inventory_2</span>
          {t('notFoundCatalog')}
        </Link>
      </div>
    </div>
  )
}
