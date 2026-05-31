import type { OrderStatus } from '@/lib/types/database.types'
import { getTranslations } from 'next-intl/server'

const STATUS_CLASSES: Record<OrderStatus, string> = {
  pending:   'bg-[#2b2a26] text-[#ecc246]',
  confirmed: 'bg-[#1a2520] text-emerald-400',
  shipped:   'bg-[#1a2030] text-blue-400',
  delivered: 'bg-[#1a2b1a] text-green-400',
  cancelled: 'bg-[#2b1a1a] text-red-400',
}

const FALLBACK_CLASSES = 'bg-[#2b2a26] text-on-surface-variant'

export default async function StatusBadge({ status }: { status: string }) {
  const t = await getTranslations('common')

  const STATUS_LABELS: Record<OrderStatus, string> = {
    pending:   t('statusPending'),
    confirmed: t('statusConfirmed'),
    shipped:   t('statusShipped'),
    delivered: t('statusDelivered'),
    cancelled: t('statusCancelled'),
  }

  const label   = STATUS_LABELS[status as OrderStatus] ?? t('statusUnknown')
  const classes = STATUS_CLASSES[status as OrderStatus] ?? FALLBACK_CLASSES

  return (
    <span className={`chip px-2 py-0.5 font-technical-data text-[10px] uppercase tracking-wider ${classes}`}>
      {label}
    </span>
  )
}
