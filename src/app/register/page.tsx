import type { Metadata } from 'next'
import RegisterForm from '@/components/auth/RegisterForm'

export const metadata: Metadata = {
  title: 'Реєстрація | Trade M',
}

export default function RegisterPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-margin-mobile py-16">
      <div className="w-full max-w-md bg-card border-card rounded-lg p-8 space-y-6">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest">
            Реєстрація
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">
            Створіть акаунт для доступу до особистого кабінету
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  )
}
