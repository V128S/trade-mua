import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import ResetPasswordForm from '@/components/auth/ResetPasswordForm'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth' })
  return {
    title: t('resetTitle'),
    alternates: { languages: { uk: '/auth/reset-password', en: '/en/auth/reset-password', 'x-default': '/auth/reset-password' } },
  }
}

export default async function ResetPasswordPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'auth' })

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-margin-mobile">
      <div className="w-full max-w-md bg-card border-card rounded-lg p-8 space-y-6">
        <h1 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest">
          {t('resetHeading')}
        </h1>
        <ResetPasswordForm />
      </div>
    </div>
  )
}
