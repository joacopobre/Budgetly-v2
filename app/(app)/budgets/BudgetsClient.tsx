'use client'

import { MoreHorizontal, Plus } from 'lucide-react'
import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { BudgetsContext } from '@/context/BudgetsContext'
import type { Budget, BudgetKind } from '@/types/budgets'
import { BudgetLineChart } from '@/components/budgets/BudgetLineChart'
import { BudgetModal } from '@/components/budgets/BudgetModal'
import { FundModal } from '@/components/budgets/FundModal'
import { SpendingLimits } from '@/components/budgets/SpendingLimits'
import { buildBudgetBalanceSeries } from '@/lib/budgets/buildBudgetBalanceSeries'
import { Transaction } from '@/types/transactions'
import { TransactionsContext } from '@/context/TransactionsContext'
import type { CategoryLimit } from '@/types/categoryLimits'
import { formatCurrency } from '@/lib/currency'

type Props = {
  initialBudgets: Budget[]
  initialLimits: CategoryLimit[]
}

const formatAmount = (value: number) => formatCurrency(value, { decimals: 'auto' })

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' }
  if (d.getFullYear() !== now.getFullYear()) opts.year = 'numeric'
  return d.toLocaleDateString('en-GB', opts)
}

export default function BudgetsClient({ initialBudgets, initialLimits }: Props) {
  const [isFundModalOpen, setIsFundModalOpen] = useState(false)
  const [fundMode, setFundMode] = useState<'ADD' | 'WITHDRAW' | null>(null)
  const [activeBudgetId, setActiveBudgetId] = useState<string | null>(null)
  const [fundAmount, setFundAmount] = useState('')
  const [fundNote, setFundNote] = useState('')
  const [isFundNoteOpen, setIsFundNoteOpen] = useState(false)

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [budgetKind, setBudgetKind] = useState<BudgetKind>('SPEND')
  const [name, setName] = useState<string>('')
  const [limit, setLimit] = useState<string>('')
  const [startingAmount, setStartingAmount] = useState<string>('')
  const [rollover, setRollover] = useState<boolean>(false)
  const [editingBudgetId, setEditingBudgetId] = useState<null | string>(null)

  // Three-dot menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuContainerRef = useRef<HTMLDivElement>(null)

  // Expanded chart state
  const [expandedBudgetId, setExpandedBudgetId] = useState<string | null>(null)

  const context = useContext(BudgetsContext)
  if (!context) throw new Error('BudgetsContext missing')
  const { budgets, setBudgets } = context

  useEffect(() => {
    setBudgets(initialBudgets)
  }, [initialBudgets, setBudgets])

  const txContext = useContext(TransactionsContext)
  if (!txContext) throw new Error('TransactionsContext missing')
  const { transactions, setTransactions } = txContext

  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [fundError, setFundError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Close three-dot menu on outside click
  useEffect(() => {
    if (!openMenuId) return
    const handler = (e: MouseEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openMenuId])

  const handleDelete = async (id: string) => {
    setDeleteError(null)
    const res = await fetch(`/api/budgets/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      setDeleteError(data.error ?? 'Failed to delete budget.')
      return
    }
    setBudgets(prev => prev.filter(budget => budget.id !== id))
  }

  const handleConfirmFunds = async (
    id: string | null,
    fund: string | null,
    mode: 'ADD' | 'WITHDRAW' | null,
  ) => {
    if (!id || !mode) return
    const amount = Number(fund)
    if (!Number.isFinite(amount) || amount <= 0) return

    const res = await fetch(`/api/budgets/${id}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, amount, note: fundNote.trim() || undefined }),
    })
    if (!res.ok) {
      const data = await res.json()
      setFundError(data.error ?? 'Something went wrong.')
      return
    }
    setFundError(null)

    const data = await res.json()
    const updatedBudget: Budget = data.budget
    const createdTransactions: Transaction[] = data.transactions

    setBudgets(prev => prev.map(b => (b.id === updatedBudget.id ? updatedBudget : b)))
    setTransactions(prev => [...createdTransactions, ...prev])
    closeFundModal()
  }

  const closeFundModal = () => {
    setActiveBudgetId(null)
    setFundMode(null)
    setFundAmount('')
    setFundNote('')
    setFundError(null)
    setIsFundModalOpen(false)
    setIsFundNoteOpen(false)
  }

  const handleSave = async () => {
    const validatedName = name.trim()
    const validatedLimit = Number(limit)
    if (validatedName === '') return

    if (editingBudgetId !== null) {
      const isSave = budgetKind === 'SAVE'
      const target = isSave ? validatedLimit : undefined
      if (isSave && (isNaN(validatedLimit) || validatedLimit <= 0)) return

      const res = await fetch(`/api/budgets/${editingBudgetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: validatedName,
          kind: budgetKind,
          target,
          rollover: budgetKind === 'SPEND' ? rollover : undefined,
        }),
      })
      if (!res.ok) return
      const updatedBudget: Budget = await res.json()
      setBudgets(prev => prev.map(b => (b.id === updatedBudget.id ? updatedBudget : b)))
      closeModal()
      return
    }

    const isSave = budgetKind === 'SAVE'
    const validatedTarget = Number(limit)
    const hasStartingAmount = startingAmount.trim() !== ''
    const validatedStartingAmount = Number(startingAmount)
    if (isSave && (isNaN(validatedTarget) || validatedTarget <= 0)) return
    if (hasStartingAmount && (isNaN(validatedStartingAmount) || validatedStartingAmount < 0)) return

    const res = await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: validatedName,
        kind: budgetKind,
        target: isSave ? validatedTarget : undefined,
        startingAmount: hasStartingAmount ? validatedStartingAmount : undefined,
        rollover: budgetKind === 'SPEND' ? rollover : undefined,
      }),
    })
    if (!res.ok) {
      const data = await res.json()
      setSaveError(data.error ?? 'Something went wrong.')
      return
    }
    setSaveError(null)
    const createdBudget: Budget = await res.json()
    setBudgets(prev => [...prev, createdBudget])
    closeModal()
  }

  const closeModal = () => {
    setLimit('')
    setStartingAmount('')
    setName('')
    setRollover(false)
    setSaveError(null)
    setIsModalOpen(false)
    setEditingBudgetId(null)
  }

  const activeBudget = activeBudgetId ? (budgets.find(b => b.id === activeBudgetId) ?? null) : null

  // Insights calculations
  const availableLiquidity = useMemo(
    () => budgets.filter(b => b.kind === 'SPEND').reduce((sum, b) => sum + b.balance, 0),
    [budgets],
  )

  const avgDailyBurn = useMemo(() => {
    const now = new Date()
    const dayOfMonth = now.getDate()
    const monthExpenses = transactions
      .filter(tx => {
        if (tx.type !== 'Expense') return false
        const d = new Date(tx.date)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
    return dayOfMonth > 0 ? monthExpenses / dayOfMonth : 0
  }, [transactions])

  // Recent adjustments — last 10 events across all budgets
  const recentAdjustments = useMemo(
    () =>
      budgets
        .flatMap(b =>
          (b.events ?? []).map(e => ({
            budgetName: b.name,
            action: e.delta > 0 ? 'Add' : 'Withdraw',
            amount: Math.abs(e.delta),
            date: e.date,
          })),
        )
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10),
    [budgets],
  )

  const openAddBudget = () => {
    setEditingBudgetId(null)
    setName('')
    setLimit('')
    setStartingAmount('')
    setIsModalOpen(true)
    setBudgetKind('SPEND')
  }

  const openFunds = (mode: 'ADD' | 'WITHDRAW', id: string) => {
    setFundMode(mode)
    setActiveBudgetId(id)
    setFundAmount('')
    setFundNote('')
    setIsFundModalOpen(true)
    setIsFundNoteOpen(false)
    setOpenMenuId(null)
  }

  return (
    <main className="bl-container bl-page">
      {/* Click-outside overlay for three-dot menus */}
      {openMenuId && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
      )}

      {/* Header */}
      <div className="bl-head bl-rise">
        <h1 className="bl-h1">Budgets</h1>
        <button type="button" className="bl-btn bl-btn--sm bl-btn--primary" onClick={openAddBudget}>
          <Plus aria-hidden="true" />
          Add budget
        </button>
      </div>

      {deleteError && (
        <div className="bl-alert bl-alert--neg" role="alert">
          {deleteError}
        </div>
      )}

      {/* Two-column layout: main + sidebar */}
      <div
        className="bl-rise grid gap-x-3 gap-y-8 lg:grid-cols-[minmax(0,1fr)_320px]"
        style={{ '--i': 1 } as React.CSSProperties}
        ref={menuContainerRef}
      >
        {/* Main area */}
        <div className="flex min-w-0 flex-col gap-8">
          {budgets.length === 0 && (
            <div className="bl-empty py-14">
              <p className="text-base font-medium text-ink">No budgets yet</p>
              <p className="max-w-xs">
                Set money aside to spend, or save towards a goal, and watch each pot move.
              </p>
              <button type="button" className="bl-btn bl-btn--sm bl-btn--outline mt-4" onClick={openAddBudget}>
                <Plus aria-hidden="true" />
                Add your first budget
              </button>
            </div>
          )}

          {/* Budget cards grid */}
          {budgets.length > 0 && (
          <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2">
            {budgets.map(budget => {
              const chartData = buildBudgetBalanceSeries(budget.events ?? [], 30)
              const isSave = budget.kind === 'SAVE'
              const current = budget.balance
              const target = budget.target ?? 0
              const saveProgress =
                isSave && target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
              const spendProgress =
                !isSave && target > 0
                  ? Math.min(100, Math.round(((target - current) / target) * 100))
                  : 0
              const barPercent = isSave ? saveProgress : spendProgress
              const isOverspent = !isSave && spendProgress > 80
              const barClass = isSave ? '' : isOverspent ? 'bl-bar--neg' : 'bl-bar--muted'
              const isExpanded = expandedBudgetId === budget.id
              const isMenuOpen = openMenuId === budget.id

              return (
                <div key={budget.id} className="bl-card bl-card--pad relative flex flex-col">
                  {/* Card header */}
                  <div className="flex h-8 items-center gap-2.5">
                    <h2 className="bl-card-title truncate">{budget.name}</h2>
                    <span className={`bl-chip ${isSave ? 'bl-chip--accent' : ''}`}>
                      {isSave ? 'Save' : 'Spend'}
                    </span>

                    {/* Three-dot menu */}
                    <div className="relative -mr-2 ml-auto shrink-0">
                      <button
                        type="button"
                        title="Actions"
                        aria-label={`Actions for ${budget.name}`}
                        aria-haspopup="menu"
                        aria-expanded={isMenuOpen}
                        className="bl-icon-btn"
                        onClick={e => {
                          e.stopPropagation()
                          setOpenMenuId(isMenuOpen ? null : budget.id)
                        }}
                      >
                        <MoreHorizontal aria-hidden="true" />
                      </button>

                      {isMenuOpen && (
                        <div className="bl-menu top-full right-0 mt-1 w-44 min-w-0 origin-top-right" role="menu">
                          <button
                            type="button"
                            role="menuitem"
                            className="bl-menu__item"
                            onClick={() => openFunds('ADD', budget.id)}
                          >
                            Add funds
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            className="bl-menu__item"
                            onClick={() => openFunds('WITHDRAW', budget.id)}
                          >
                            Withdraw
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            className="bl-menu__item"
                            onClick={() => {
                              setEditingBudgetId(budget.id)
                              setName(budget.name)
                              setLimit(String(budget.target ?? ''))
                              setBudgetKind(budget.kind)
                              setRollover(budget.rollover)
                              setIsModalOpen(true)
                              setOpenMenuId(null)
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            className="bl-menu__item"
                            onClick={() => {
                              setExpandedBudgetId(prev =>
                                prev === budget.id ? null : budget.id,
                              )
                              setOpenMenuId(null)
                            }}
                          >
                            {isExpanded ? 'Hide history' : 'Show history'}
                          </button>
                          <div className="bl-menu__rule" />
                          <button
                            type="button"
                            role="menuitem"
                            className="bl-menu__item bl-menu__item--danger"
                            onClick={() => {
                              handleDelete(budget.id)
                              setOpenMenuId(null)
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="bl-amount">{formatAmount(current)}</span>
                    {target > 0 && (
                      <span className="text-sm text-ink-muted tabular-nums">
                        {isSave ? `/ ${formatAmount(target)} · ${saveProgress}%` : `left of ${formatAmount(target)}`}
                      </span>
                    )}
                  </div>

                  {/* Progress bar or chart */}
                  {isExpanded ? (
                    chartData.length === 0 ? (
                      <p className="mt-4 rounded-bl-md bg-sunk p-4 text-sm text-ink-muted">
                        No activity yet. Add or withdraw funds to see the trend.
                      </p>
                    ) : (
                      <div className="mt-4 rounded-bl-md bg-sunk/60 px-1 pt-3 pb-1">
                        <BudgetLineChart data={chartData} />
                      </div>
                    )
                  ) : (
                    <div className={`bl-bar mt-4 ${barClass}`}>
                      <i style={{ width: `${barPercent}%` }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          )}

          {/* Recent Adjustments */}
          {recentAdjustments.length > 0 && (
            <section className="flex flex-col gap-3">
              <p className="bl-eyebrow">Recent adjustments</p>
              <div className="bl-table-wrap overflow-x-auto">
                <table className="bl-table">
                  <thead>
                    <tr>
                      <th>Budget</th>
                      <th>Action</th>
                      <th className="text-right">Amount</th>
                      <th className="text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAdjustments.map((adj, i) => (
                      <tr key={i}>
                        <td className="font-medium">{adj.budgetName}</td>
                        <td>
                          <span className={`bl-chip ${adj.action === 'Add' ? 'bl-chip--accent' : ''}`}>
                            {adj.action}
                          </span>
                        </td>
                        <td className="text-right font-medium whitespace-nowrap">
                          {formatAmount(adj.amount)}
                        </td>
                        <td className="bl-meta text-right whitespace-nowrap">{formatDate(adj.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="flex min-w-0 flex-col gap-3">
          <SpendingLimits initialLimits={initialLimits} compact />

          {/* Insights */}
          <div className="bl-card bl-card--pad">
            <h2 className="bl-card-title">Insights</h2>
            <div className="bl-rule-list mt-2">
              <div className="flex items-center justify-between gap-3 py-3">
                <span className="text-[0.9375rem] text-ink-muted">Available liquidity</span>
                <span className="text-[0.9375rem] font-medium tabular-nums">
                  {formatAmount(availableLiquidity)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 pt-3">
                <span className="text-[0.9375rem] text-ink-muted">Avg. daily spend</span>
                <span className="text-[0.9375rem] font-medium tabular-nums">
                  {formatAmount(avgDailyBurn)}
                  <span className="font-normal text-ink-muted"> / day</span>
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <BudgetModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSave}
        editingBudgetId={editingBudgetId}
        name={name}
        setName={setName}
        limit={limit}
        setLimit={setLimit}
        startingAmount={startingAmount}
        setStartingAmount={setStartingAmount}
        budgetKind={budgetKind}
        setBudgetKind={setBudgetKind}
        rollover={rollover}
        setRollover={setRollover}
        error={saveError}
      />
      <FundModal
        isOpen={isFundModalOpen}
        onClose={closeFundModal}
        onConfirm={() => handleConfirmFunds(activeBudgetId, fundAmount, fundMode)}
        fundMode={fundMode}
        activeBudget={activeBudget}
        fundAmount={fundAmount}
        setFundAmount={setFundAmount}
        fundNote={fundNote}
        setFundNote={setFundNote}
        isFundNoteOpen={isFundNoteOpen}
        setIsFundNoteOpen={setIsFundNoteOpen}
        error={fundError}
      />
    </main>
  )
}
