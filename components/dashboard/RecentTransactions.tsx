import { formatMoney } from '@/lib/transactions/formatMoney'
import type { Transaction } from '@/types/transactions'

type Props = {
  transactions: Transaction[]
}

export function RecentTransactions({ transactions }: Props) {
  const recent = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  if (recent.length === 0) {
    return <p className="py-8 text-center text-sm text-ink-muted">No transactions yet.</p>
  }

  return (
    <div className="bl-rule-list">
      {recent.map(tx => (
        <div key={tx.id} className="flex items-center justify-between gap-4 py-3 last:pb-0">
          <div className="min-w-0">
            <p className="truncate text-[0.9375rem] font-medium">{tx.description}</p>
            <p className="bl-meta mt-0.5 truncate">
              {new Date(tx.date).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
              })}{' '}
              · {tx.category}
            </p>
          </div>
          <span
            className={`shrink-0 text-[0.9375rem] font-medium tabular-nums ${tx.amount > 0 ? 'text-positive' : ''}`}
          >
            {tx.amount > 0 ? '+' : ''}
            {formatMoney(tx.amount)}
          </span>
        </div>
      ))}
    </div>
  )
}
