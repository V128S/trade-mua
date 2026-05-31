import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import RegisterForm from '@/components/auth/RegisterForm'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth' })
  return { title: t('registerTitle') }
}

export default async function RegisterPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'auth' })

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-margin-mobile py-16">
      <div className="w-full max-w-md bg-card border-card rounded-lg p-8 space-y-6">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest">
            {t('registerHeading')}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">
            {t('registerSubheading')}
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  )
}
