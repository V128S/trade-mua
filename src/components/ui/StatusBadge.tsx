import type { OrderStatus } from '@/lib/types/database.types'
import { useTranslations } from 'next-intl'

const STATUS_CLASSES: Record<OrderStatus, string> = {
  pending:   'bg-amber-100 text-amber-700 dark:bg-[#2b2a26] dark:text-[#ecc246]',
  confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-[#1a2520] dark:text-emerald-400',
  shipped:   'bg-blue-100 text-blue-700 dark:bg-[#1a2030] dark:text-blue-400',
  delivered: 'bg-green-100 text-green-700 dark:bg-[#1a2b1a] dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-[#2b1a1a] dark:text-red-400',
}

const FALLBACK_CLASSES = 'bg-surface-container-high text-on-surface-variant'

// Isomorphic via next-intl's useTranslations — works in BOTH server components
// (dashboard OrderList) and client components (admin OrdersTable). The previous
// async getTranslations() crashed with a 500 when rendered inside the client
// OrdersTable as soon as an order existed.
export default function StatusBadge({ status }: { status: string }) {
  const t = useTranslations('common')

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
