import type { Metadata } from 'next'
import ResetPasswordForm from '@/components/auth/ResetPasswordForm'

export const metadata: Metadata = { title: 'Відновлення пароля | Trade M' }

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-margin-mobile">
      <div className="w-full max-w-md bg-card border-card rounded-lg p-8 space-y-6">
        <h1 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest">
          Відновлення пароля
        </h1>
        <ResetPasswordForm />
      </div>
    </div>
  )
}
