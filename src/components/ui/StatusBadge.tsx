import type { OrderStatus } from '@/lib/types/database.types'

const STATUS_CONFIG: Record<OrderStatus, { label: string; classes: string }> = {
  pending:   { label: 'Очікує',       classes: 'bg-[#2b2a26] text-[#ecc246]' },
  confirmed: { label: 'Підтверджено', classes: 'bg-[#1a2520] text-emerald-400' },
  shipped:   { label: 'Відправлено',  classes: 'bg-[#1a2030] text-blue-400' },
  delivered: { label: 'Доставлено',   classes: 'bg-[#1a2b1a] text-green-400' },
  cancelled: { label: 'Скасовано',    classes: 'bg-[#2b1a1a] text-red-400' },
}

export default function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={`chip px-2 py-0.5 font-technical-data text-[10px] uppercase tracking-wider ${cfg.classes}`}>
      {cfg.label}
    </span>
  )
}
