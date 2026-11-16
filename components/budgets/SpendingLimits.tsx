'use client'

import { useContext, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { TransactionsContext } from '@/context/TransactionsContext'
import { SpendingLimitModal } from './SpendingLimitModal'
import type { CategoryLimit } from '@/types/categoryLimits'
import { formatCurrency } from '@/lib/currency'

type Props = {
  initialLimits: CategoryLimit[]
  compact?: boolean
}

const formatAmount = (value: number) => formatCurrency(value, { decimals: 'auto' })

export function SpendingLimits({ initialLimits, compact = false }: Props) {
  const [limits, setLimits] = useState<CategoryLimit[]>(initialLimits)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLimit, setEditingLimit] = useState<CategoryLimit | null>(null)

  const txContext = useContext(TransactionsContext)
  if (!txContext) throw new Error('TransactionsContext missing')
  const { transactions } = txContext

  // Current month expense totals per category
  const spentByCategory = useMemo(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const map: Record<string, number> = {}
    for (const tx of transactions) {
      if (tx.type !== 'Expense') continue
      const d = new Date(tx.date)
      if (d.getFullYear() !== year || d.getMonth() !== month) continue
      map[tx.category] = (map[tx.category] ?? 0) + Math.abs(tx.amount)
    }
    return map
  }, [transactions])

  const usedCategories = useMemo(
    () =>
      Array.from(new Set(transactions.map(tx => tx.category).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [transactions],
  )

  const availableCategories = useMemo(
    () => usedCategories.filter(cat => !limits.some(l => l.category === cat)),
    [usedCategories, limits],
  )

  const handleAdd = async (category: string, monthlyLimit: number) => {
    const res = await fetch('/api/category-limits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, monthlyLimit }),
    })
    if (!res.ok) return
    const created: CategoryLimit = await res.json()
    setLimits(prev => [...prev, created].sort((a, b) => a.category.localeCompare(b.category)))
    setIsModalOpen(false)
  }

  const handleUpdate = async (id: string, monthlyLimit: number) => {
    const res = await fetch(`/api/category-limits/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monthlyLimit }),
    })
    if (!res.ok) return
    const updated: CategoryLimit = await res.json()
    setLimits(prev => prev.map(l => (l.id === id ? updated : l)))
    setEditingLimit(null)
    setIsModalOpen(false)
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/category-limits/${id}`, { method: 'DELETE' })
    if (!res.ok) return
    setLimits(prev => prev.filter(l => l.id !== id))
  }

  const openEdit = (limit: CategoryLimit) => {
    setEditingLimit(limit)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingLimit(null)
  }

  /** How one limit is doing this month. */
  const statusOf = (limit: CategoryLimit) => {
    const spent = spentByCategory[limit.category] ?? 0
    const pct = limit.monthlyLimit > 0 ? (spent / limit.monthlyLimit) * 100 : 0
    const isOver = pct >= 100
    const isWarning = !isOver && pct >= 80
    return {
      spent,
      clampedPct: Math.min(pct, 100),
      isOver,
      isWarning,
      barClass: isOver ? 'bl-bar--neg' : isWarning ? 'bl-bar--warn' : '',
    }
  }

  const modal = (
    <SpendingLimitModal
      isOpen={isModalOpen}
      onClose={closeModal}
      onSave={handleAdd}
      onUpdate={handleUpdate}
      categories={availableCategories}
      editingLimit={editingLimit}
    />
  )

  const openAdd = () => {
    setEditingLimit(null)
    setIsModalOpen(true)
  }

  if (compact) {
    return (
      <section className="bl-card bl-card--pad">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="bl-card-title">Spending limits</h2>
            <p className="bl-eyebrow mt-1.5 text-[0.6875rem]">Monthly caps · reset on the 1st</p>
          </div>
          <button
            type="button"
            title="Add spending limit"
            aria-label="Add spending limit"
            className="bl-icon-btn -mt-1 -mr-2"
            onClick={openAdd}
          >
            <Plus aria-hidden="true" />
          </button>
        </div>

        {limits.length === 0 ? (
          <p className="mt-4 text-sm text-ink-muted">
            No limits set. Add one to track what a category spends each month.
          </p>
        ) : (
          <div className="bl-rule-list mt-2">
            {limits.map(limit => {
              const { spent, clampedPct, isOver, isWarning, barClass } = statusOf(limit)

              return (
                <button
                  key={limit.id}
                  type="button"
                  title="Edit limit"
                  className="group flex w-full flex-col gap-2.5 py-3.5 text-left last:pb-0"
                  onClick={() => openEdit(limit)}
                >
                  <span className="flex w-full items-center gap-2">
                    <span className="truncate text-[0.9375rem] font-medium group-hover:underline group-hover:underline-offset-4">
                      {limit.category}
                    </span>
                    {isOver && <span className="bl-chip bl-chip--neg">Over</span>}
                    {isWarning && <span className="bl-chip bl-chip--warn">Near</span>}
                    <span className="ml-auto shrink-0 text-sm text-ink-muted tabular-nums">
                      <span className="font-medium text-ink">{formatAmount(spent)}</span> /{' '}
                      {formatAmount(limit.monthlyLimit)}
                    </span>
                  </span>
                  <span className={`bl-bar block w-full ${barClass}`}>
                    <i style={{ width: `${clampedPct}%` }} />
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {modal}
      </section>
    )
  }

  // Full layout
  return (
    <section className="flex flex-col gap-4">
      <div className="bl-head">
        <div>
          <h2 className="text-2xl font-medium tracking-[-0.03em]">Spending limits</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Monthly caps per category. They reset automatically each month.
          </p>
        </div>
        <button type="button" className="bl-btn bl-btn--sm bl-btn--primary" onClick={openAdd}>
          <Plus aria-hidden="true" />
          Add limit
        </button>
      </div>

      {limits.length === 0 ? (
        <div className="bl-empty">No spending limits set. Add one to start tracking a category.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {limits.map(limit => {
            const { spent, clampedPct, isOver, isWarning, barClass } = statusOf(limit)

            return (
              <div key={limit.id} className="bl-card bl-card--pad flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <h3 className="bl-card-title truncate">{limit.category}</h3>
                  {isOver && <span className="bl-chip bl-chip--neg">Over</span>}
                  {isWarning && <span className="bl-chip bl-chip--warn">Near</span>}
                  <span className="ml-auto shrink-0 text-sm text-ink-muted tabular-nums">
                    <span className="font-medium text-ink">{formatAmount(spent)}</span> /{' '}
                    {formatAmount(limit.monthlyLimit)}
                  </span>
                </div>
                <div className={`bl-bar ${barClass}`}>
                  <i style={{ width: `${clampedPct}%` }} />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button type="button" className="bl-btn bl-btn--xs bl-btn--ghost" onClick={() => openEdit(limit)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="bl-btn bl-btn--xs bl-btn--danger"
                    onClick={() => handleDelete(limit.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal}
    </section>
  )
}
