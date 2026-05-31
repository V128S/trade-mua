import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CheckoutForm from '@/components/cart/CheckoutForm'

export const metadata: Metadata = { title: 'Оформлення | Trade M' }

export default async function CheckoutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/checkout')

  const { data: profile } = await supabase
    .from('profiles')
    .select('phone')
    .eq('id', user.id)
    .single()

  return (
    <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-16 pb-section-gap">
      <div className="flex items-center gap-4 mb-10">
        <div className="h-px bg-outline-variant flex-1" />
        <h1 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest whitespace-nowrap">Оформлення</h1>
        <div className="h-px bg-outline-variant flex-1" />
      </div>
      <CheckoutForm defaultPhone={profile?.phone ?? ''} />
    </div>
  )
}
