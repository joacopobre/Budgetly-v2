'use client'

import { ChevronLeft, ChevronRight, Pencil, Repeat } from 'lucide-react'
import type { Transaction } from '@/types/transactions'

const PAGE_SIZE = 10

export function formatTxDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' }
  if (d.getFullYear() !== now.getFullYear()) opts.year = 'numeric'
  return d.toLocaleDateString('en-GB', opts)
}

export function RecurrenceChip({ recurrence }: { recurrence: Transaction['recurrence'] }) {
  if (recurrence === 'NONE') return null
  return (
    <span className="bl-chip bl-chip--accent">
      <Repeat aria-hidden="true" className="size-2.5" />
      {recurrence}
    </span>
  )
}

type PaginationProps = {
  totalCount: number
  currentPage: number
  onPageChange: (page: number) => void
  className?: string
}

export function TransactionsPagination({
  totalCount,
  currentPage,
  onPageChange,
  className = '',
}: PaginationProps) {
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const startIndex = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const endIndex = Math.min(currentPage * PAGE_SIZE, totalCount)

  if (totalCount === 0) return null

  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      <span className="bl-meta">
        {startIndex}–{endIndex} of {totalCount}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Previous page"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="bl-icon-btn size-8"
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        <span className="bl-meta min-w-12 text-center">
          {currentPage} / {totalPages || 1}
        </span>
        <button
          type="button"
          aria-label="Next page"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="bl-icon-btn size-8"
        >
          <ChevronRight aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

type Props = {
  transactions: Transaction[]
  onEdit: (tx: Transaction) => void
  formatMoney: (value: number) => string
  getSourceLabel: (tx: Transaction) => string
  totalCount: number
  currentPage: number
  onPageChange: (page: number) => void
}

export function TransactionsTable({
  transactions,
  onEdit,
  formatMoney,
  getSourceLabel,
  totalCount,
  currentPage,
  onPageChange,
}: Props) {
  return (
    <div
      className="bl-table-wrap bl-rise hidden md:block"
      style={{ '--i': 2 } as React.CSSProperties}
    >
      <table className="bl-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th>Type</th>
            <th>From</th>
            <th className="text-right">Amount</th>
            <th className="w-12" />
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 ? (
            <tr>
              <td colSpan={7} className="h-32 text-center text-sm text-ink-muted">
                No transactions found.
              </td>
            </tr>
          ) : (
            transactions.map(tx => (
              <tr key={tx.id} className="group">
                <td className="bl-meta whitespace-nowrap">{formatTxDate(tx.date)}</td>
                <td className="font-medium">
                  <span className="flex items-center gap-2">
                    {tx.description}
                    <RecurrenceChip recurrence={tx.recurrence} />
                  </span>
                </td>
                <td>
                  <span className="bl-cat">
                    <i />
                    {tx.category}
                  </span>
                </td>
                <td className="text-ink-muted">{tx.type}</td>
                <td className="text-ink-muted">{getSourceLabel(tx)}</td>
                <td
                  className={`text-right font-medium whitespace-nowrap ${tx.amount > 0 ? 'text-positive' : ''}`}
                >
                  {tx.amount > 0 ? '+' : ''}
                  {formatMoney(tx.amount)}
                </td>
                <td className="pr-3 pl-0 text-right">
                  <button
                    type="button"
                    title="Edit transaction"
                    aria-label={`Edit ${tx.description}`}
                    className="bl-icon-btn size-8 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                    onClick={() => onEdit(tx)}
                  >
                    <Pencil aria-hidden="true" className="size-4" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <TransactionsPagination
        totalCount={totalCount}
        currentPage={currentPage}
        onPageChange={onPageChange}
        className="border-t border-line py-2 pr-3 pl-5"
      />
    </div>
  )
}
