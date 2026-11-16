'use client'

import { useContext, useEffect, useRef, useState } from 'react'
import type { RecurrenceFrequency, TxSource, TxType } from '@/types/transactions'
import { BudgetsContext } from '@/context/BudgetsContext'
import { Check, ChevronDown, Plus, X } from 'lucide-react'
import { DatePicker } from '@/components/ui/DatePicker'
import { DEFAULT_CURRENCY } from '@/lib/currency'

type Props = {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  onDelete?: () => void
  editingId: number | null
  date: string
  setDate: (v: string) => void
  description: string
  setDescription: (v: string) => void
  category: string
  setCategory: (v: string) => void
  categories: string[]
  type: TxType
  setType: (v: TxType) => void
  amount: string
  setAmount: (v: string) => void
  source: TxSource
  setSource: (v: TxSource) => void
  budgetId: string | null
  setBudgetId: (v: string | null) => void
  recurrence: RecurrenceFrequency
  setRecurrence: (v: RecurrenceFrequency) => void
  apiError?: string | null
}

const typeOptions: TxType[] = ['Expense', 'Income']

const sentenceCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()

const Required = () => (
  <span className="text-negative" aria-hidden="true">
    *
  </span>
)

const recurrenceOptions: { value: RecurrenceFrequency; label: string }[] = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
]

export function TransactionModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingId,
  date,
  setDate,
  description,
  setDescription,
  category,
  setCategory,
  categories,
  type,
  setType,
  amount,
  setAmount,
  source,
  setSource,
  budgetId,
  setBudgetId,
  recurrence,
  setRecurrence,
  apiError,
}: Props) {
  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false)
  const typeMenuRef = useRef<HTMLDivElement>(null)

  const [isFromMenuOpen, setIsFromMenuOpen] = useState(false)
  const fromMenuRef = useRef<HTMLDivElement>(null)

  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false)
  const [categorySearch, setCategorySearch] = useState('')
  const categoryMenuRef = useRef<HTMLDivElement>(null)
  const categoryInputRef = useRef<HTMLInputElement>(null)

  const [isRecurrenceMenuOpen, setIsRecurrenceMenuOpen] = useState(false)
  const recurrenceMenuRef = useRef<HTMLDivElement>(null)

  const [errors, setErrors] = useState<{
    date?: string
    description?: string
    category?: string
    amount?: string
    from?: string
  }>({})

  // get budgets via context
  const context = useContext(BudgetsContext)
  if (!context) throw new Error('BudgetsContext missing')
  const { budgets } = context

  const spendBudgets = budgets.filter(b => b.kind === 'SPEND')

  const isRecurring = recurrence !== 'NONE'

  useEffect(() => {
    if (!isOpen) {
      setErrors({})
      return
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prev
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (category) setErrors(prev => ({ ...prev, category: undefined }))
  }, [category])

  useEffect(() => {
    setErrors(prev => ({ ...prev, from: undefined }))
  }, [source, budgetId])

  function handleSave() {
    const newErrors: typeof errors = {}
    if (!date) newErrors.date = 'This field is required'
    if (!description.trim()) newErrors.description = 'This field is required'
    if (!category.trim()) newErrors.category = 'This field is required'
    if (!amount.trim()) newErrors.amount = 'This field is required'
    if (type !== 'Income' && source === 'BUDGET' && !budgetId) newErrors.from = 'This field is required'
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    onSave()
  }

  useEffect(() => {
    if (!isTypeMenuOpen && !isFromMenuOpen && !isCategoryMenuOpen && !isRecurrenceMenuOpen) return
    const onClickAway = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node
      if (typeMenuRef.current && typeMenuRef.current.contains(target)) return
      if (fromMenuRef.current && fromMenuRef.current.contains(target)) return
      if (categoryMenuRef.current && categoryMenuRef.current.contains(target)) return
      if (recurrenceMenuRef.current && recurrenceMenuRef.current.contains(target)) return
      setIsTypeMenuOpen(false)
      setIsFromMenuOpen(false)
      setIsCategoryMenuOpen(false)
      setIsRecurrenceMenuOpen(false)
    }
    document.addEventListener('mousedown', onClickAway)
    document.addEventListener('touchstart', onClickAway)
    return () => {
      document.removeEventListener('mousedown', onClickAway)
      document.removeEventListener('touchstart', onClickAway)
    }
  }, [isTypeMenuOpen, isFromMenuOpen, isCategoryMenuOpen, isRecurrenceMenuOpen])

  if (!isOpen) return null

  return (
    <div className="bl-scrim" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tx-modal-title"
        className="bl-modal max-w-[540px]"
        onClick={e => e.stopPropagation()}
      >
        <div className="bl-modal__head">
          <div>
            <h2 id="tx-modal-title" className="bl-modal__title">
              {editingId ? 'Edit transaction' : 'Add transaction'}
            </h2>
            <p className="bl-modal__sub">Enter details for this transaction.</p>
          </div>
          <button type="button" className="bl-icon-btn" onClick={onClose} aria-label="Close modal">
            <X aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <label className="bl-field" htmlFor="description">
            <span>
              Description <Required />
            </span>
            <input
              id="description"
              type="text"
              value={description}
              onChange={e => { setDescription(e.target.value); setErrors(prev => ({ ...prev, description: undefined })) }}
              className="bl-input"
              aria-invalid={!!errors.description}
              placeholder="e.g. Coffee"
            />
            {errors.description && <p className="bl-field__error">{errors.description}</p>}
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="bl-field relative" ref={categoryMenuRef}>
              <span>
                Category <Required />
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsCategoryMenuOpen(prev => !prev)
                  setCategorySearch('')
                  setTimeout(() => categoryInputRef.current?.focus(), 0)
                }}
                className="bl-input"
                aria-haspopup="listbox"
                aria-expanded={isCategoryMenuOpen}
                aria-invalid={!!errors.category}
              >
                <span className={`truncate ${category ? '' : 'bl-placeholder'}`}>
                  {category ? sentenceCase(category) : 'Choose…'}
                </span>
                <ChevronDown aria-hidden="true" />
              </button>

              {isCategoryMenuOpen && (
                <div className="bl-menu top-full left-0 mt-1.5 p-0">
                  <div className="border-b border-line p-1.5">
                    <input
                      ref={categoryInputRef}
                      type="text"
                      value={categorySearch}
                      onChange={e => setCategorySearch(e.target.value)}
                      placeholder="Search or create…"
                      className="h-8 w-full rounded-bl-sm bg-transparent px-2 text-sm text-ink outline-none placeholder:text-ink-faint"
                    />
                  </div>
                  <div className="flex max-h-48 flex-col overflow-y-auto p-1.5" role="listbox">
                    {categories
                      .filter(c => c.toLowerCase().includes(categorySearch.toLowerCase()))
                      .map(c => (
                        <button
                          key={c}
                          type="button"
                          role="option"
                          aria-selected={c === category}
                          className="bl-menu__item"
                          onClick={() => {
                            setCategory(c)
                            setIsCategoryMenuOpen(false)
                            setCategorySearch('')
                          }}
                        >
                          {sentenceCase(c)}
                          {c === category && <Check aria-hidden="true" />}
                        </button>
                      ))}
                    {categorySearch.trim() &&
                      !categories.some(
                        c => c.toLowerCase() === categorySearch.trim().toLowerCase(),
                      ) && (
                        <button
                          type="button"
                          className="bl-menu__item justify-start gap-2 text-brand-ink"
                          onClick={() => {
                            setCategory(categorySearch.trim())
                            setIsCategoryMenuOpen(false)
                            setCategorySearch('')
                          }}
                        >
                          <Plus aria-hidden="true" />
                          <span className="truncate">
                            Create &quot;{categorySearch.trim()}&quot;
                          </span>
                        </button>
                      )}
                    {categories.length === 0 && !categorySearch.trim() && (
                      <p className="px-[11px] py-2 text-sm text-ink-faint">
                        Start typing to create a category
                      </p>
                    )}
                  </div>
                </div>
              )}
              {errors.category && <p className="bl-field__error">{errors.category}</p>}
            </div>

            <label className="bl-field" htmlFor="amount">
              <span>
                Amount <Required />
              </span>
              <span className="bl-affix">
                <span aria-hidden="true">{DEFAULT_CURRENCY.symbol}</span>
                <input
                  id="amount"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={amount}
                  onChange={e => { setAmount(e.target.value); setErrors(prev => ({ ...prev, amount: undefined })) }}
                  className="bl-input"
                  aria-invalid={!!errors.amount}
                  placeholder="0.00"
                />
              </span>
              {errors.amount && <p className="bl-field__error">{errors.amount}</p>}
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="bl-field">
              <span>
                Date <Required />
              </span>
              <DatePicker
                value={date}
                onChange={v => { setDate(v); setErrors(prev => ({ ...prev, date: undefined })) }}
                error={!!errors.date}
              />
              {errors.date && <p className="bl-field__error">{errors.date}</p>}
            </div>

            <div className="bl-field relative" ref={typeMenuRef}>
              <span>
                Type <Required />
              </span>
              <button
                type="button"
                onClick={() => setIsTypeMenuOpen(prev => !prev)}
                className="bl-input"
                aria-haspopup="listbox"
                aria-expanded={isTypeMenuOpen}
              >
                {type}
                <ChevronDown aria-hidden="true" />
              </button>

              {isTypeMenuOpen && (
                <div className="bl-menu top-full left-0 mt-1.5" role="listbox">
                  {typeOptions.map(option => (
                    <button
                      key={option}
                      type="button"
                      role="option"
                      aria-selected={option === type}
                      className="bl-menu__item"
                      onClick={() => {
                        setType(option)
                        setIsTypeMenuOpen(false)
                        if (option === 'Income') {
                          setSource('ACCOUNT')
                          setBudgetId(null)
                        }
                      }}
                    >
                      {option}
                      {option === type && <Check aria-hidden="true" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {type !== 'Income' && (
            <div className="bl-field relative" ref={fromMenuRef}>
              <span>
                From <Required />
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsFromMenuOpen(prev => !prev)
                }}
                className="bl-input"
                aria-haspopup="listbox"
                aria-expanded={isFromMenuOpen}
                aria-invalid={!!errors.from}
              >
                {source === 'ACCOUNT'
                  ? 'Account'
                  : spendBudgets.find(b => b.id === budgetId)?.name ?? 'Budget'}
                <ChevronDown aria-hidden="true" />
              </button>

              {isFromMenuOpen && (
                <div className="bl-menu top-full left-0 mt-1.5 max-h-56 overflow-y-auto" role="listbox">
                  <button
                    type="button"
                    role="option"
                    aria-selected={source === 'ACCOUNT'}
                    className="bl-menu__item"
                    onClick={() => {
                      setSource('ACCOUNT')
                      setBudgetId(null)
                      setIsFromMenuOpen(false)
                    }}
                  >
                    Account
                    {source === 'ACCOUNT' && <Check aria-hidden="true" />}
                  </button>
                  {spendBudgets.map(budget => (
                    <button
                      key={budget.id}
                      type="button"
                      role="option"
                      aria-selected={source === 'BUDGET' && budgetId === budget.id}
                      className="bl-menu__item"
                      onClick={() => {
                        setSource('BUDGET')
                        setBudgetId(budget.id)
                        setIsFromMenuOpen(false)
                      }}
                    >
                      {budget.name}
                      {source === 'BUDGET' && budgetId === budget.id && <Check aria-hidden="true" />}
                    </button>
                  ))}
                </div>
              )}
              {errors.from && <p className="bl-field__error">{errors.from}</p>}
            </div>
          )}

          {/* Recurrence */}
          <div className="flex flex-col gap-4 rounded-bl-md border border-line px-3.5 py-3">
            <div className="flex items-center justify-between gap-3">
              <span id="tx-recurring-label" className="text-[0.9375rem] font-medium">
                Recurring
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={isRecurring}
                aria-labelledby="tx-recurring-label"
                onClick={() => setRecurrence(isRecurring ? 'NONE' : 'MONTHLY')}
                className="bl-switch"
              >
                <i />
              </button>
            </div>

            {isRecurring && (
              <div className="bl-field relative" ref={recurrenceMenuRef}>
                <span>Frequency</span>
                <button
                  type="button"
                  onClick={() => setIsRecurrenceMenuOpen(prev => !prev)}
                  className="bl-input"
                  aria-haspopup="listbox"
                  aria-expanded={isRecurrenceMenuOpen}
                >
                  {recurrenceOptions.find(o => o.value === recurrence)?.label ?? 'Monthly'}
                  <ChevronDown aria-hidden="true" />
                </button>

                {isRecurrenceMenuOpen && (
                  <div className="bl-menu bottom-full left-0 mb-1.5 origin-bottom" role="listbox">
                    {recurrenceOptions.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        role="option"
                        aria-selected={option.value === recurrence}
                        className="bl-menu__item"
                        onClick={() => {
                          setRecurrence(option.value)
                          setIsRecurrenceMenuOpen(false)
                        }}
                      >
                        {option.label}
                        {option.value === recurrence && <Check aria-hidden="true" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {apiError && (
          <p className="bl-alert bl-alert--neg" role="alert">
            {apiError}
          </p>
        )}

        <div className="bl-modal__foot">
          {editingId !== null && onDelete && (
            <button type="button" className="bl-btn bl-btn--sm bl-btn--danger mr-auto" onClick={onDelete}>
              Delete
            </button>
          )}
          <button type="button" className="bl-btn bl-btn--sm bl-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="bl-btn bl-btn--sm bl-btn--primary" onClick={handleSave}>
            {editingId ? 'Save changes' : 'Add transaction'}
          </button>
        </div>
      </div>
    </div>
  )
}
