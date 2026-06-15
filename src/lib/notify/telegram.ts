import type { OrderItem } from '@/lib/types/database.types'

// Base site URL, mirrored from layout.tsx / sitemap.ts (no NEXT_PUBLIC_SITE_URL).
const SITE_URL = 'https://трейдм.com.ua'

export interface OrderNotification {
  id: string
  items: OrderItem[]
  total: number
  firstName: string
  lastName: string
  phone: string
  city: string
  branch: string
  notes?: string | null
  promoCode?: string | null
  discountPct?: number | null
}

// Escape the five characters that matter for Telegram's HTML parse_mode, so
// user-provided fields (name, comment) can't break the message markup.
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// Pure: builds the HTML message body. No network, no env — unit-tested directly.
export function formatOrderMessage(o: OrderNotification): string {
  const lines: string[] = []
  lines.push(`🛒 <b>Нове замовлення</b> #${esc(o.id.slice(0, 8))}`)
  lines.push('')
  lines.push(`👤 ${esc(o.firstName)} ${esc(o.lastName)}`)
  lines.push(`📞 ${esc(o.phone)}`)
  lines.push('')
  for (const item of o.items) {
    lines.push(`• ${esc(item.name)} ×${item.qty}`)
  }
  if (o.promoCode) {
    lines.push(`🏷 Промокод ${esc(o.promoCode)} (−${o.discountPct ?? 0}%)`)
  }
  lines.push(`💰 <b>$${o.total.toLocaleString('en-US')}</b>`)
  lines.push('')
  lines.push(`🚚 ${esc(o.city)}, ${esc(o.branch)}`)
  if (o.notes && o.notes.trim()) {
    lines.push(`📝 ${esc(o.notes.trim())}`)
  }
  lines.push('')
  lines.push(`🔗 ${SITE_URL}/admin/orders`)
  return lines.join('\n')
}

// Pure: message sent to the director when a customer cancels their order.
export function formatCancellationMessage(o: OrderNotification): string {
  const lines: string[] = []
  lines.push(`❌ <b>Замовлення скасовано клієнтом</b> #${esc(o.id.slice(0, 8))}`)
  lines.push('')
  lines.push(`👤 ${esc(o.firstName)} ${esc(o.lastName)}`)
  lines.push(`📞 ${esc(o.phone)}`)
  lines.push(`💰 $${o.total.toLocaleString('en-US')}`)
  lines.push('')
  lines.push(`🔗 ${SITE_URL}/admin/orders`)
  return lines.join('\n')
}

// Side effect: POST a message to the director's chat. No-ops when env keys are
// missing (local dev without credentials). Throws only on transport failure —
// callers wrap this so it never breaks the order action.
async function sendToDirector(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_DIRECTOR_CHAT_ID
  if (!token || !chatId) return

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Telegram sendMessage failed: ${res.status} ${detail}`)
  }
}

export async function notifyDirectorNewOrder(order: OrderNotification): Promise<void> {
  await sendToDirector(formatOrderMessage(order))
}

export async function notifyDirectorOrderCancelled(order: OrderNotification): Promise<void> {
  await sendToDirector(formatCancellationMessage(order))
}
