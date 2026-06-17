import { NextRequest, NextResponse } from 'next/server'
import { requireStaff } from '@/lib/supabase/admin'
import { sendCustomerOrderEmail } from '@/lib/notify/email'
import type { OrderItem, OrderStatus } from '@/lib/types/database.types'

const VALID_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await requireStaff()
  if (!supabase) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await request.json()
  const status: OrderStatus = body.status

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const { data: order, error: readErr } = await supabase.from('orders').select('*').eq('id', id).single()
  if (readErr || !order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // No-op (and no email) when the status is unchanged — avoids a duplicate email
  // on a repeated save of the same status.
  if (order.status === status) return NextResponse.json({ ok: true })

  const { error } = await supabase.from('orders').update({ status }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Email the customer for every status except a (rare) return to pending.
  if (status !== 'pending') {
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
          promoCode: order.promo_code,
          discountPct: order.discount_pct,
        },
        status,
      )
    } catch (e) {
      console.error('customer status email failed', e)
    }
  }

  return NextResponse.json({ ok: true })
}
