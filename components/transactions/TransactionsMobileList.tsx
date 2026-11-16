'use client'

import type { Transaction } from '@/types/transactions'
import { formatTxDate, RecurrenceChip } from './TransactionsTable'

type Props = {
  transactions: Transaction[]
  onEdit: (tx: Transaction) => void
  onDelete: (id: number) => void
  formatMoney: (value: number) => string
  getSourceLabel: (tx: Transaction) => string
}

export function TransactionsMobileList({
  transactions,
  onEdit,
  onDelete,
  formatMoney,
  getSourceLabel,
}: Props) {
  if (transactions.length === 0) {
    return <p className="bl-empty md:hidden">No transactions found.</p>
  }

  return (
    <div className="bl-card bl-rule-list bl-rise md:hidden" style={{ '--i': 2 } as React.CSSProperties}>
      {transactions.map(tx => (
        <div key={tx.id} className="flex flex-col gap-3 px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 font-medium">
                {tx.description}
                <RecurrenceChip recurrence={tx.recurrence} />
              </p>
              <p className="bl-meta mt-1">
                {formatTxDate(tx.date)} · {tx.category}
              </p>
            </div>
            <span
              className={`shrink-0 font-medium whitespace-nowrap tabular-nums ${tx.amount > 0 ? 'text-positive' : ''}`}
            >
              {tx.amount > 0 ? '+' : ''}
              {formatMoney(tx.amount)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-ink-muted">
              {tx.type} · from {getSourceLabel(tx)}
            </span>
            <div className="flex items-center gap-2">
              <button type="button" className="bl-btn bl-btn--xs bl-btn--ghost" onClick={() => onEdit(tx)}>
                Edit
              </button>
              <button
                type="button"
                className="bl-btn bl-btn--xs bl-btn--danger"
                onClick={() => onDelete(tx.id)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
