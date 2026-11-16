'use client'

import { Check, ChevronDown, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { CategoryLimit } from '@/types/categoryLimits'
import { DEFAULT_CURRENCY } from '@/lib/currency'

const sentenceCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()

type Props = {
  isOpen: boolean
  onClose: () => void
  onSave: (category: string, monthlyLimit: number) => Promise<void>
  onUpdate: (id: string, monthlyLimit: number) => Promise<void>
  categories: string[]
  editingLimit: CategoryLimit | null
}

export function SpendingLimitModal({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  categories,
  editingLimit,
}: Props) {
  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false)
  const categoryMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editingLimit) {
      setCategory(editingLimit.category)
      setAmount(String(editingLimit.monthlyLimit))
    } else {
      setCategory('')
      setAmount('')
    }
  }, [editingLimit, isOpen])

  useEffect(() => {
    if (!isOpen) return
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

  useEffect(() => {
    if (!isCategoryMenuOpen) return
    const onClickAway = (e: MouseEvent | TouchEvent) => {
      if (categoryMenuRef.current && categoryMenuRef.current.contains(e.target as Node)) return
      setIsCategoryMenuOpen(false)
    }
    document.addEventListener('mousedown', onClickAway)
    document.addEventListener('touchstart', onClickAway)
    return () => {
      document.removeEventListener('mousedown', onClickAway)
      document.removeEventListener('touchstart', onClickAway)
    }
  }, [isCategoryMenuOpen])

  if (!isOpen) return null

  const handleSave = async () => {
    const parsedAmount = Number(amount)
    if (!category || isNaN(parsedAmount) || parsedAmount <= 0) return

    setIsSaving(true)
    try {
      if (editingLimit) {
        await onUpdate(editingLimit.id, parsedAmount)
      } else {
        await onSave(category, parsedAmount)
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bl-scrim" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="limit-modal-title"
        className="bl-modal max-w-[440px]"
        onClick={e => e.stopPropagation()}
      >
        <div className="bl-modal__head">
          <div>
            <h2 id="limit-modal-title" className="bl-modal__title">
              {editingLimit ? 'Edit spending limit' : 'Add spending limit'}
            </h2>
            <p className="bl-modal__sub">Set a monthly cap for a transaction category.</p>
          </div>
          <button type="button" className="bl-icon-btn" onClick={onClose} aria-label="Close modal">
            <X aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bl-field">
            <span>Category</span>
            {editingLimit ? (
              <input
                id="category"
                aria-label="Category"
                value={category ? sentenceCase(category) : category}
                disabled
                className="bl-input"
              />
            ) : (
              <div className="relative" ref={categoryMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsCategoryMenuOpen(prev => !prev)}
                  className="bl-input"
                  aria-haspopup="listbox"
                  aria-expanded={isCategoryMenuOpen}
                >
                  <span className={`truncate ${category ? '' : 'bl-placeholder'}`}>
                    {category ? sentenceCase(category) : 'Choose…'}
                  </span>
                  <ChevronDown aria-hidden="true" />
                </button>
                {isCategoryMenuOpen && (
                  <div
                    className="bl-menu top-full left-0 z-[9999] mt-1.5 max-h-48 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    role="listbox"
                  >
                    {categories.length === 0 ? (
                      <p className="px-[11px] py-2 text-sm text-ink-faint">No categories available</p>
                    ) : (
                      categories.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          role="option"
                          aria-selected={cat === category}
                          className="bl-menu__item"
                          onClick={() => {
                            setCategory(cat)
                            setIsCategoryMenuOpen(false)
                          }}
                        >
                          {sentenceCase(cat)}
                          {cat === category && <Check aria-hidden="true" />}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <label className="bl-field" htmlFor="limit-amount">
            Monthly limit
            <span className="bl-affix">
              <span aria-hidden="true">{DEFAULT_CURRENCY.symbol}</span>
              <input
                id="limit-amount"
                value={amount}
                onChange={e => setAmount(e.currentTarget.value)}
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                className="bl-input"
                placeholder="0.00"
              />
            </span>
          </label>
        </div>

        <div className="bl-modal__foot">
          <button type="button" className="bl-btn bl-btn--sm bl-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving}
            className="bl-btn bl-btn--sm bl-btn--primary"
            onClick={handleSave}
          >
            {editingLimit ? 'Save changes' : 'Add limit'}
          </button>
        </div>
      </div>
    </div>
  )
}
