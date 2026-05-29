import type { Metadata } from 'next'
import LoginForm from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Вхід | Trade M',
}

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-margin-mobile">
      <div className="w-full max-w-md bg-card border-card rounded-lg p-8 space-y-6">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest">
            Вхід
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">
            Введіть email та пароль для входу в кабінет
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
