'use client'

import type { TooltipProps } from 'recharts'
import { formatCurrency } from '@/lib/currency'

type Props = TooltipProps<number, string> & {
  /** Display names by data key. */
  labels?: Record<string, string>
}

/** Chart tooltip for money series, in the Budgetly card style. */
export function MoneyTooltip({ active, payload, label, labels = {} }: Props) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-bl-md border border-line bg-surface px-3 py-2.5 text-ink shadow-bl-md">
      {label != null && label !== '' && <p className="bl-meta mb-2">{label}</p>}
      <div className="grid gap-1.5">
        {payload.map(item => {
          const key = String(item.dataKey)
          return (
            <div key={key} className="flex items-center gap-2 text-[0.8125rem]">
              <i className="size-2 shrink-0 rounded-[2px]" style={{ background: item.color }} />
              <span className="text-ink-muted">{labels[key] ?? item.name}</span>
              <span className="ml-auto pl-5 font-medium tabular-nums">
                {formatCurrency(Number(item.value))}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Axis label for month points: "Nov 2026" → "Nov 26". Anything else is left as is. */
export function shortAxisLabel(label: string): string {
  const m = /^([A-Za-z]{3}) \d{2}(\d{2})$/.exec(label)
  return m ? `${m[1]} ${m[2]}` : label
}
