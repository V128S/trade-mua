import type { OrderItem } from '@/lib/types/database.types'

// Base site URL, mirrored from layout.tsx / sitemap.ts (no NEXT_PUBLIC_SITE_URL).
const SITE_URL = 'https://trade-mua.vercel.app'

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

// Side effect: sends the message to the director's Telegram chat. No-ops when
// the env keys are missing so local dev without credentials still works. Never
// throws on transport failure — callers must not let this break order creation.
export async function notifyDirectorNewOrder(order: OrderNotification): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_DIRECTOR_CHAT_ID
  if (!token || !chatId) return

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: formatOrderMessage(order),
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Telegram sendMessage failed: ${res.status} ${detail}`)
  }
}
