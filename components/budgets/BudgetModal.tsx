'use client'

import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { BudgetKind } from '@/types/budgets'
import { DEFAULT_CURRENCY } from '@/lib/currency'

const Required = () => (
  <span className="text-negative" aria-hidden="true">
    *
  </span>
)

type Props = {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  editingBudgetId: string | null
  name: string
  setName: (v: string) => void
  limit: string
  setLimit: (v: string) => void
  startingAmount: string
  setStartingAmount: (v: string) => void
  budgetKind: BudgetKind
  setBudgetKind: (v: BudgetKind) => void
  rollover: boolean
  setRollover: (v: boolean) => void
  error?: string | null
}

export function BudgetModal({
  isOpen,
  onClose,
  onSave,
  editingBudgetId,
  name,
  setName,
  limit,
  setLimit,
  startingAmount,
  setStartingAmount,
  budgetKind,
  setBudgetKind,
  rollover,
  setRollover,
  error,
}: Props) {
  const [errors, setErrors] = useState<{
    name?: string
    limit?: string
    startingAmount?: string
  }>({})

  useEffect(() => {
    if (!isOpen) {
      setErrors({})
      return
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  function handleSave() {
    const newErrors: typeof errors = {}
    if (!name.trim()) newErrors.name = 'This field is required'
    if (budgetKind === 'SAVE' && !limit.trim()) newErrors.limit = 'This field is required'
    if (editingBudgetId === null && !startingAmount.trim()) newErrors.startingAmount = 'This field is required'
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    onSave()
  }

  if (!isOpen) return null

  return (
    <div className="bl-scrim" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="budget-modal-title"
        className="bl-modal"
        onClick={e => e.stopPropagation()}
      >
        <div className="bl-modal__head">
          <div>
            <h2 id="budget-modal-title" className="bl-modal__title">
              {editingBudgetId ? 'Edit budget' : 'Add budget'}
            </h2>
            <p className="bl-modal__sub">
              {budgetKind === 'SAVE'
                ? 'A pot that grows towards a goal.'
                : 'A pot of money set aside to spend.'}
            </p>
          </div>
          <button type="button" className="bl-icon-btn" onClick={onClose} aria-label="Close modal">
            <X aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bl-seg" role="group" aria-label="Budget type">
            <button
              type="button"
              aria-pressed={budgetKind === 'SPEND'}
              onClick={() => setBudgetKind('SPEND')}
            >
              Spend
            </button>
            <button
              type="button"
              aria-pressed={budgetKind === 'SAVE'}
              onClick={() => setBudgetKind('SAVE')}
            >
              Save
            </button>
          </div>

          <label className="bl-field" htmlFor="name">
            <span>
              Budget name <Required />
            </span>
            <input
              id="name"
              value={name}
              onChange={e => { setName(e.currentTarget.value); setErrors(prev => ({ ...prev, name: undefined })) }}
              type="text"
              className="bl-input"
              aria-invalid={!!errors.name}
              placeholder="e.g. Groceries"
            />
            {errors.name && <p className="bl-field__error">{errors.name}</p>}
          </label>

          <div className={`grid gap-4 ${budgetKind === 'SAVE' && editingBudgetId === null ? 'sm:grid-cols-2' : ''}`}>
            {budgetKind === 'SAVE' && (
              <label className="bl-field" htmlFor="limit">
                <span>
                  Goal amount <Required />
                </span>
                <span className="bl-affix">
                  <span aria-hidden="true">{DEFAULT_CURRENCY.symbol}</span>
                  <input
                    id="limit"
                    value={limit}
                    onChange={e => { setLimit(e.currentTarget.value); setErrors(prev => ({ ...prev, limit: undefined })) }}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    className="bl-input"
                    aria-invalid={!!errors.limit}
                    placeholder="0.00"
                  />
                </span>
                {errors.limit && <p className="bl-field__error">{errors.limit}</p>}
              </label>
            )}

            {editingBudgetId === null && (
              <label className="bl-field" htmlFor="startingAmount">
                <span>
                  {budgetKind === 'SAVE' ? 'Initial deposit' : 'Starting amount'} <Required />
                </span>
                <span className="bl-affix">
                  <span aria-hidden="true">{DEFAULT_CURRENCY.symbol}</span>
                  <input
                    id="startingAmount"
                    value={startingAmount}
                    onChange={e => { setStartingAmount(e.currentTarget.value); setErrors(prev => ({ ...prev, startingAmount: undefined })) }}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    className="bl-input"
                    aria-invalid={!!errors.startingAmount}
                    placeholder="0.00"
                  />
                </span>
                {errors.startingAmount && <p className="bl-field__error">{errors.startingAmount}</p>}
              </label>
            )}
          </div>

          {budgetKind === 'SPEND' && (
            <div className="flex items-center justify-between gap-4 rounded-bl-md border border-line px-3.5 py-3">
              <div>
                <p id="budget-rollover-label" className="text-[0.9375rem] font-medium">
                  Roll over unused balance
                </p>
                <p className="mt-0.5 text-sm text-ink-muted">If off, balance resets to zero each month</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={rollover}
                aria-labelledby="budget-rollover-label"
                onClick={() => setRollover(!rollover)}
                className="bl-switch"
              >
                <i />
              </button>
            </div>
          )}
        </div>

        {error && (
          <p className="bl-alert bl-alert--neg" role="alert">
            {error}
          </p>
        )}

        <div className="bl-modal__foot">
          <button type="button" className="bl-btn bl-btn--sm bl-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="bl-btn bl-btn--sm bl-btn--primary" onClick={handleSave}>
            {editingBudgetId ? 'Save changes' : 'Add budget'}
          </button>
        </div>
      </div>
    </div>
  )
}
