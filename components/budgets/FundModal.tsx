'use client'

import { Plus, X } from 'lucide-react'
import type { Budget } from '@/types/budgets'
import { DEFAULT_CURRENCY, formatCurrency } from '@/lib/currency'

type Props = {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  fundMode: 'ADD' | 'WITHDRAW' | null
  activeBudget: Budget | null
  fundAmount: string
  setFundAmount: (v: string) => void
  fundNote: string
  setFundNote: (v: string) => void
  isFundNoteOpen: boolean
  setIsFundNoteOpen: (v: boolean) => void
  error?: string | null
}

export function FundModal({
  isOpen,
  onClose,
  onConfirm,
  fundMode,
  activeBudget,
  fundAmount,
  setFundAmount,
  fundNote,
  setFundNote,
  isFundNoteOpen,
  setIsFundNoteOpen,
  error,
}: Props) {
  if (!isOpen) return null

  return (
    <div className="bl-scrim" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="fund-modal-title"
        className="bl-modal max-w-[440px]"
        onClick={e => e.stopPropagation()}
      >
        <div className="bl-modal__head">
          <div>
            <h2 id="fund-modal-title" className="bl-modal__title">
              {fundMode === 'ADD' ? 'Add funds' : 'Withdraw funds'}
            </h2>
            {activeBudget && (
              <p className="bl-modal__sub">
                {activeBudget.name} ·{' '}
                <span className="font-medium text-ink tabular-nums">
                  {formatCurrency(activeBudget.balance)}
                </span>{' '}
                {fundMode === 'WITHDRAW' ? 'available' : 'now'}
              </p>
            )}
          </div>
          <button type="button" className="bl-icon-btn" onClick={onClose} aria-label="Close modal">
            <X aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <label className="bl-field" htmlFor="fund">
            {fundMode === 'ADD' ? 'Amount to add' : 'Amount to withdraw'}
            <span className="bl-affix">
              <span aria-hidden="true">{DEFAULT_CURRENCY.symbol}</span>
              <input
                id="fund"
                type="number"
                inputMode="decimal"
                className="bl-input"
                placeholder="0.00"
                value={fundAmount}
                onChange={e => setFundAmount(e.currentTarget.value)}
              />
            </span>
          </label>

          {isFundNoteOpen ? (
            <label className="bl-field" htmlFor="note">
              <span className="flex items-center justify-between">
                Note
                <button
                  type="button"
                  className="bl-link text-ink-muted"
                  onClick={() => {
                    setIsFundNoteOpen(false)
                    setFundNote('')
                  }}
                >
                  Remove
                </button>
              </span>
              <input
                id="note"
                type="text"
                className="bl-input"
                placeholder="e.g. rent"
                value={fundNote}
                onChange={e => setFundNote(e.currentTarget.value)}
              />
            </label>
          ) : (
            <button
              type="button"
              className="bl-btn bl-btn--xs bl-btn--quiet -ml-2.5 self-start"
              onClick={() => setIsFundNoteOpen(true)}
            >
              <Plus aria-hidden="true" />
              Add a note
            </button>
          )}

          {error && (
            <p className="bl-alert bl-alert--neg" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="bl-modal__foot">
          <button type="button" className="bl-btn bl-btn--sm bl-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="bl-btn bl-btn--sm bl-btn--primary" onClick={onConfirm}>
            {fundMode === 'ADD' ? 'Add funds' : 'Withdraw'}
          </button>
        </div>
      </div>
    </div>
  )
}
