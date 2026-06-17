'use server'
import { createClient } from '@/lib/supabase/server'
import { notifyDirectorOrderCancelled } from '@/lib/notify/telegram'
import { sendCustomerOrderEmail } from '@/lib/notify/email'
import type { OrderItem } from '@/lib/types/database.types'

// Cancels the caller's own order via the SECURITY DEFINER `cancel_order` RPC,
// which only succeeds while the order is still 'pending'. On success the
// director is notified on Telegram; a notification failure never undoes the
// cancellation (the status change is the source of truth).
export async function cancelOrder(orderId: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Потрібен вхід' }

  const { data: cancelled, error } = await supabase.rpc('cancel_order', { p_order_id: orderId })
  if (error) return { error: 'Не вдалося скасувати замовлення' }
  if (!cancelled) return { error: 'Це замовлення вже неможливо скасувати' }

  const { data: order } = await supabase
    .from('orders')
    .select('id, items, total_usdt, recipient_first_name, recipient_last_name, recipient_phone, recipient_email, city, nova_poshta_branch')
    .eq('id', orderId)
    .single()

  if (order) {
    try {
      await notifyDirectorOrderCancelled({
        id: order.id,
        items: (Array.isArray(order.items) ? order.items : []) as OrderItem[],
        total: Number(order.total_usdt),
        firstName: order.recipient_first_name ?? '',
        lastName: order.recipient_last_name ?? '',
        phone: order.recipient_phone ?? '',
        city: '',
        branch: '',
      })
    } catch (e) {
      console.error('telegram cancel notify failed', e)
    }

    try {
      await sendCustomerOrderEmail(
        {
          id: order.id,
          email: order.recipient_email ?? null,
          items: (Array.isArray(order.items) ? order.items : []) as OrderItem[],
          total: Number(order.total_usdt),
          firstName: order.recipient_first_name ?? '',
          lastName: order.recipient_last_name ?? '',
          city: order.city ?? '',
          branch: order.nova_poshta_branch ?? '',
        },
        'cancelled',
      )
    } catch (e) {
      console.error('customer cancel email failed', e)
    }
  }

  return { ok: true }
}
