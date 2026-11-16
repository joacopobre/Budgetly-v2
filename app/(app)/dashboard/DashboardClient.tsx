'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, useContext } from 'react'
import { ArrowRight, Check, ChevronDown, Plus } from 'lucide-react'
import { useOnboarding, TOUR_DONE_KEY } from '@/context/OnboardingContext'
import { filterByDateRange, type TrendRange } from '@/lib/transactions/filterByDateRange'
import { calculateDashboardStats } from '@/lib/transactions/calculateDashboardStats'
import { formatMoney } from '@/lib/transactions/formatMoney'
import { formatCurrency } from '@/lib/currency'
import { buildTrendSeries } from '@/lib/transactions/buildTrendSeries'
import { TrendChart } from '@/components/dashboard/TrendChart'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'
import { buildNetWorthSeries } from '@/lib/transactions/buildNetWorthSeries'
import { NetWorthChart } from '@/components/dashboard/NetWorthChart'
import { Transaction } from '@/types/transactions'
import { TransactionsContext } from '@/context/TransactionsContext'
import { Budget } from '@/types/budgets'
import { BudgetsContext } from '@/context/BudgetsContext'

type Props = {
  initialTransactions: Transaction[]
  initialBudgets: Budget[]
}

export default function DashboardClient({ initialTransactions, initialBudgets }: Props) {
  const [trendFilter, setTrendFilter] = useState<TrendRange>('This Month')
  const txContext = useContext(TransactionsContext)
  if (!txContext) throw new Error('TransactionsContext missing')
  const { setTransactions } = txContext

  const [isOpen, setIsOpen] = useState(false)
  const trendMenuRef = useRef<HTMLDivElement>(null)
  const budgetsContext = useContext(BudgetsContext)
  if (!budgetsContext) throw new Error('BudgetsContext missing')
  const { setBudgets } = budgetsContext

  const { startTour } = useOnboarding()

  useEffect(() => {
    setBudgets(initialBudgets)
  }, [initialBudgets, setBudgets])

  useEffect(() => {
    setTransactions(initialTransactions)
  }, [initialTransactions, setTransactions])

  useEffect(() => {
    if (initialTransactions.length === 0 && initialBudgets.length === 0) {
      try {
        if (!localStorage.getItem(TOUR_DONE_KEY)) startTour()
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // This-month stats (always fixed, independent of trendFilter)
  const thisMonthTx = filterByDateRange(initialTransactions, 'This Month')
  const thisMonthStats = calculateDashboardStats(thisMonthTx)

  // Last-month for comparison
  const lastMonthTx = initialTransactions.filter(tx => {
    const d = new Date(tx.date)
    const now = new Date()
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return d.getFullYear() === lm.getFullYear() && d.getMonth() === lm.getMonth()
  })
  const lastMonthStats = calculateDashboardStats(lastMonthTx)

  // All-time balance
  const allTimeBalance = initialTransactions.reduce((sum, tx) => sum + tx.amount, 0)
  const inBudgets = initialBudgets.reduce((sum, b) => sum + b.balance, 0)
  const availableBalance = allTimeBalance - inBudgets

  // Trend chart & net-worth data (follow trendFilter)
  const filtered = filterByDateRange(initialTransactions, trendFilter)
  const trendSeries = buildTrendSeries(filtered)
  const netWorthSeries = buildNetWorthSeries(initialTransactions, trendFilter)

  // Secondary-line helpers
  const savingsRate =
    thisMonthStats.totalIncome > 0
      ? Math.round(
          ((thisMonthStats.totalIncome - thisMonthStats.totalExpenses) /
            thisMonthStats.totalIncome) *
            100,
        )
      : null

  const spentDelta =
    lastMonthStats.totalExpenses > 0
      ? ((thisMonthStats.totalExpenses - lastMonthStats.totalExpenses) /
          lastMonthStats.totalExpenses) *
        100
      : null

  // Net worth card: where the line ends, and how far it moved over the range
  const netWorthNow = netWorthSeries.length > 0 ? netWorthSeries[netWorthSeries.length - 1].balance : null
  const netWorthChange =
    netWorthSeries.length > 1 ? netWorthSeries[netWorthSeries.length - 1].balance - netWorthSeries[0].balance : null

  const handleClick = () => setIsOpen(prev => !prev)
  const applyFilter = (filter: TrendRange) => {
    setTrendFilter(filter)
    handleClick()
  }

  useEffect(() => {
    if (!isOpen) return
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (!trendMenuRef.current) return
      if (!trendMenuRef.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [isOpen])

  return (
    <main className="bl-container bl-page">
      {/* Page header */}
      <div className="bl-head bl-rise">
        <h1 className="bl-h1">Dashboard</h1>
        <Link
          href="/transactions"
          data-tour="add-transaction"
          className="bl-btn bl-btn--sm bl-btn--primary"
        >
          <Plus aria-hidden="true" />
          Add transaction
        </Link>
      </div>

      {/* Stat cards */}
      <section
        data-tour="dashboard-stats"
        className="bl-rise grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4"
        style={{ '--i': 1 } as React.CSSProperties}
      >
        <div className="bl-card bl-card--pad flex flex-col gap-3">
          <p className="bl-eyebrow">Total balance</p>
          <p className="bl-amount">{formatMoney(allTimeBalance)}</p>
          <p className="text-sm text-ink-muted">
            {formatMoney(availableBalance)} available · {formatMoney(inBudgets)} in budgets
          </p>
        </div>

        <div className="bl-card bl-card--pad flex flex-col gap-3">
          <p className="bl-eyebrow">Income this month</p>
          <p className="bl-amount text-positive">{formatMoney(thisMonthStats.totalIncome)}</p>
          <p className="text-sm text-ink-muted">
            {savingsRate !== null
              ? savingsRate >= 0
                ? `Saving ${savingsRate}% of income`
                : `Overspending by ${Math.abs(savingsRate)}%`
              : 'No income this month'}
          </p>
        </div>

        <div className="bl-card bl-card--pad flex flex-col gap-3">
          <p className="bl-eyebrow">Spent this month</p>
          <p className="bl-amount">{formatMoney(thisMonthStats.totalExpenses)}</p>
          <p className="text-sm text-ink-muted">
            {spentDelta !== null
              ? `${spentDelta > 0 ? '+' : ''}${spentDelta.toFixed(1)}% vs last month`
              : 'No data last month'}
          </p>
        </div>

        <div className="bl-card bl-card--pad flex flex-col gap-3">
          <p className="bl-eyebrow">Net savings</p>
          <p className={`bl-amount ${thisMonthStats.balance < 0 ? 'text-negative' : ''}`}>
            {formatMoney(thisMonthStats.balance)}
          </p>
          <p className="text-sm text-ink-muted">
            {thisMonthStats.balance >= 0 ? 'Positive this month' : 'Negative this month'}
          </p>
        </div>
      </section>

      {/* Trends: the range sets both charts */}
      <section
        data-tour="dashboard-trend"
        className="bl-rise flex flex-col gap-3"
        style={{ '--i': 2 } as React.CSSProperties}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="bl-eyebrow">Trends</p>
          <div className="relative" ref={trendMenuRef}>
            <button
              type="button"
              onClick={handleClick}
              className="bl-input bl-input--sm w-auto"
              aria-haspopup="listbox"
              aria-expanded={isOpen}
            >
              {trendFilter}
              <ChevronDown aria-hidden="true" />
            </button>
            {isOpen && (
              <div className="bl-menu top-full right-0 mt-1.5 w-48 origin-top-right" role="listbox">
                {(['This Month', 'Last 3 Months', 'This Year'] as const).map(opt => (
                  <button
                    key={opt}
                    type="button"
                    role="option"
                    aria-selected={trendFilter === opt}
                    className="bl-menu__item"
                    onClick={() => applyFilter(opt)}
                  >
                    {opt}
                    {trendFilter === opt && <Check aria-hidden="true" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr]">
          <div className="bl-card bl-card--pad min-w-0">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <h2 className="bl-card-title">Income and spending</h2>
              <p className="bl-legend">
                <span>
                  <i />
                  Income
                </span>
                <span>
                  <i className="is-muted" />
                  Spending
                </span>
              </p>
            </div>
            <TrendChart data={trendSeries} />
          </div>

          <div className="bl-card bl-card--pad min-w-0">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="bl-card-title">Net worth</h2>
              {netWorthChange !== null && (
                <span className={`bl-chip ${netWorthChange >= 0 ? 'bl-chip--accent' : 'bl-chip--neg'}`}>
                  {formatCurrency(netWorthChange, { signed: true, decimals: 'never' })}
                </span>
              )}
            </div>
            {netWorthNow !== null && (
              <p className="bl-amount mb-4">{formatCurrency(netWorthNow, { decimals: 'never' })}</p>
            )}
            <NetWorthChart data={netWorthSeries} />
          </div>
        </div>
      </section>

      {/* Recent transactions and budgets */}
      <div
        className="bl-rise grid gap-3 lg:grid-cols-[1.5fr_1fr]"
        style={{ '--i': 3 } as React.CSSProperties}
      >
        <section className="bl-card bl-card--pad min-w-0">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="bl-card-title">Recent transactions</h2>
            <Link href="/transactions" className="bl-link inline-flex items-center gap-1 text-sm">
              View all
              <ArrowRight aria-hidden="true" className="size-3.5" />
            </Link>
          </div>
          <RecentTransactions transactions={initialTransactions} />
        </section>

        <section className="bl-card bl-card--pad flex min-w-0 flex-col">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="bl-card-title">Budgets</h2>
            <Link href="/budgets" className="bl-link inline-flex items-center gap-1 text-sm">
              View all
              <ArrowRight aria-hidden="true" className="size-3.5" />
            </Link>
          </div>

          {initialBudgets.length > 0 ? (
            <div className="bl-rule-list">
              {initialBudgets.slice(0, 5).map(budget => {
                const isSave = budget.kind === 'SAVE'
                const current = budget.balance
                const target = budget.target ?? 0
                const progress =
                  isSave && target > 0
                    ? Math.min(100, Math.round((current / target) * 100))
                    : 0

                return (
                  <div key={budget.id} className="flex flex-col gap-2.5 py-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-[0.9375rem] font-medium">{budget.name}</span>
                        <span className={`bl-chip ${isSave ? 'bl-chip--accent' : ''}`}>
                          {isSave ? 'Save' : 'Spend'}
                        </span>
                      </div>
                      <span className="shrink-0 text-sm text-ink-muted tabular-nums">
                        {isSave ? (
                          <>
                            <span className="font-medium text-ink">{formatMoney(current)}</span> /{' '}
                            {formatMoney(target)}
                          </>
                        ) : (
                          <span className="font-medium text-ink">{formatMoney(current)}</span>
                        )}
                      </span>
                    </div>
                    <div className={`bl-bar ${isSave ? '' : 'bl-bar--muted'}`}>
                      <i style={{ width: isSave ? `${progress}%` : '100%' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <Link href="/budgets" className="bl-empty mt-2 transition-colors hover:border-brand hover:text-ink">
              <Plus aria-hidden="true" className="size-5" />
              <span className="font-medium">Create your first budget</span>
            </Link>
          )}

          {initialBudgets.length > 0 && (
            <Link href="/budgets" className="bl-btn bl-btn--sm bl-btn--ghost mt-auto w-full">
              <Plus aria-hidden="true" />
              Add budget
            </Link>
          )}
        </section>
      </div>
    </main>
  )
}
