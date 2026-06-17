import type { OrderItem } from '@/lib/types/database.types'

const SITE_URL = 'https://традем.com.ua'
const FROM = 'TradeM <no-reply@xn--80aid2aql.com.ua>'
const RESEND_ENDPOINT = 'https://api.resend.com/emails'

export type OrderEmailEvent = 'placed' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

export interface OrderEmailData {
  id: string
  email: string | null
  items: OrderItem[]
  total: number
  firstName: string
  lastName: string
  city: string
  branch: string
  promoCode?: string | null
  discountPct?: number | null
}

// Escape the three characters that matter for HTML so user-provided fields
// (item name, branch) can't break the markup.
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const SUBJECT_WORD: Record<OrderEmailEvent, string> = {
  placed: 'прийнято',
  confirmed: 'підтверджено',
  shipped: 'відправлено',
  delivered: 'доставлено',
  cancelled: 'скасовано',
}

const EVENT_COPY: Record<OrderEmailEvent, { tag: string; heading: string; intro: string }> = {
  placed: { tag: 'Замовлення', heading: 'Замовлення прийнято', intro: 'Дякуємо за замовлення! Ми отримали його та скоро звʼяжемося для підтвердження.' },
  confirmed: { tag: 'Статус', heading: 'Замовлення підтверджено', intro: 'Ваше замовлення підтверджено й готується до відправлення.' },
  shipped: { tag: 'Доставка', heading: 'Замовлення відправлено', intro: 'Ваше замовлення передано в доставку Новою Поштою.' },
  delivered: { tag: 'Доставка', heading: 'Замовлення доставлено', intro: 'Ваше замовлення доставлено. Дякуємо, що обрали TradeM!' },
  cancelled: { tag: 'Статус', heading: 'Замовлення скасовано', intro: 'Ваше замовлення скасовано. Якщо це сталося помилково — напишіть нам, і ми допоможемо.' },
}

// Pure: builds the UA subject + branded dark/gold HTML. No network, no env.
export function formatCustomerOrderEmail(o: OrderEmailData, event: OrderEmailEvent): { subject: string; html: string } {
  const shortId = o.id.slice(0, 8)
  const copy = EVENT_COPY[event]
  const subject = `Замовлення #${shortId} ${SUBJECT_WORD[event]} — TradeM`

  const itemsRows = o.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0;font-family:Arial,sans-serif;font-size:14px;color:#d1c5af;">${esc(i.name)} ×${i.qty}</td>` +
        `<td align="right" style="padding:6px 0;font-family:Arial,sans-serif;font-size:14px;color:#e5e2db;white-space:nowrap;">$${(i.price_usdt * i.qty).toLocaleString('en-US')}</td></tr>`,
    )
    .join('')

  const promoRow = o.promoCode
    ? `<tr><td colspan="2" style="padding:6px 0;font-family:Arial,sans-serif;font-size:13px;color:#9a8f78;">Промокод ${esc(o.promoCode)} (−${o.discountPct ?? 0}%)</td></tr>`
    : ''

  const html = `<!DOCTYPE html><html lang="uk"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="color-scheme" content="dark"/></head>
<body style="margin:0;padding:0;background-color:#0e0e0a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0e0e0a;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">
        <tr><td style="height:3px;line-height:3px;font-size:3px;background-color:#ecc246;border-radius:8px 8px 0 0;">&nbsp;</td></tr>
        <tr><td style="background-color:#1a1918;border:1px solid #2e2d2b;border-top:0;border-radius:0 0 8px 8px;padding:40px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td align="center" style="padding-bottom:8px;"><img src="${SITE_URL}/logo.png" width="48" height="48" alt="TradeM" style="display:block;border-radius:50%;border:0;"/></td></tr>
            <tr><td align="center"><span style="font-family:Arial,sans-serif;font-size:24px;font-weight:800;color:#e5e2db;">Trade<span style="color:#ecc246;">M</span></span></td></tr>
          </table>
          <p style="margin:24px 0 0;font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#ecc246;">${copy.tag} · #${shortId}</p>
          <h1 style="margin:8px 0 0;font-family:Arial,sans-serif;font-size:24px;font-weight:800;text-transform:uppercase;color:#e5e2db;">${copy.heading}</h1>
          <p style="margin:14px 0 0;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#d1c5af;">${copy.intro}</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;border-top:1px solid #2e2d2b;padding-top:8px;">
            ${itemsRows}
            ${promoRow}
            <tr><td style="padding:12px 0 0;border-top:1px solid #2e2d2b;font-family:Arial,sans-serif;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9a8f78;">Разом</td>
                <td align="right" style="padding:12px 0 0;border-top:1px solid #2e2d2b;font-family:Arial,sans-serif;font-size:18px;font-weight:700;color:#ecc246;">$${o.total.toLocaleString('en-US')}</td></tr>
          </table>
          <p style="margin:20px 0 0;font-family:Arial,sans-serif;font-size:13px;color:#9a8f78;">Доставка: ${esc(o.city)}, ${esc(o.branch)}</p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:28px auto 0;"><tr>
            <td align="center" bgcolor="#c9a227" style="border-radius:4px;">
              <a href="${SITE_URL}/dashboard/orders" target="_blank" style="display:inline-block;padding:14px 36px;font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#0e0e0a;text-decoration:none;">Мої замовлення</a>
            </td>
          </tr></table>
        </td></tr>
        <tr><td align="center" style="padding:24px 40px;">
          <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#6f6a5f;"><a href="https://t.me/BOSSDnepra" style="color:#ecc246;text-decoration:none;">@BOSSDnepra</a> · 097-422-50-60</p>
          <p style="margin:8px 0 0;font-family:Arial,sans-serif;font-size:11px;color:#56524a;">© 2026 TradeM · <a href="${SITE_URL}" style="color:#56524a;text-decoration:none;">традем.com.ua</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

  return { subject, html }
}

// Side effect: POST to Resend. No-ops when RESEND_API_KEY is missing (local dev)
// or the order has no email (legacy order). Throws only on transport failure —
// callers wrap so it never breaks the order action.
export async function sendCustomerOrderEmail(o: OrderEmailData, event: OrderEmailEvent): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || !o.email) return

  const { subject, html } = formatCustomerOrderEmail(o, event)
  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [o.email], subject, html }),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Resend send failed: ${res.status} ${detail}`)
  }
}
