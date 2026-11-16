'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Papa from 'papaparse'
import { Check, ChevronDown, Upload, X } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import type { TxType } from '@/types/transactions'

type Step = 1 | 2 | 3

type ColumnMap = {
  date: string
  description: string
  amount: string
  category: string
  type: string
}

type ParsedRow = {
  date: string
  description: string
  amount: number
  category: string
  type: TxType
  valid: boolean
  errors: string[]
}

type Props = {
  isOpen: boolean
  onClose: () => void
  onImported: (count: number) => void
}

function parseAmount(value: string): number | null {
  const cleaned = value.replace(/[$€£,\s]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

function parseDate(value: string): string | null {
  if (!value?.trim()) return null
  const d = new Date(value)
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  return null
}

function isValidTxType(value: string): value is TxType {
  return ['Income', 'Expense', 'Transfer'].includes(value)
}

const REQUIRED_FIELDS = ['date', 'description', 'amount'] as const
const FIELD_LABELS: Record<keyof ColumnMap, string> = {
  date: 'Date',
  description: 'Description',
  amount: 'Amount',
  category: 'Category',
  type: 'Type',
}

export function CsvImportModal({ isOpen, onClose, onImported }: Props) {
  const [step, setStep] = useState<Step>(1)
  const [isDragging, setIsDragging] = useState(false)
  const [headers, setHeaders] = useState<string[]>([])
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([])
  const [columnMap, setColumnMap] = useState<ColumnMap>({
    date: '',
    description: '',
    amount: '',
    category: '',
    type: '',
  })
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importSummary, setImportSummary] = useState<{ imported: number; failed: number } | null>(
    null,
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) {
      setStep(1)
      setIsDragging(false)
      setHeaders([])
      setRawRows([])
      setColumnMap({ date: '', description: '', amount: '', category: '', type: '' })
      setParsedRows([])
      setImporting(false)
      setImportProgress(0)
      setImportSummary(null)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !importing) onClose()
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prev
    }
  }, [isOpen, onClose, importing])

  const handleFile = useCallback((file: File) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: results => {
        const hdrs = results.meta.fields ?? []
        setHeaders(hdrs)
        setRawRows(results.data)

        const lower = hdrs.map(h => h.toLowerCase())
        const find = (candidates: string[]) =>
          hdrs.find((_, i) => candidates.includes(lower[i])) ?? ''

        setColumnMap({
          date: find(['date', 'transaction date', 'txdate', 'trans date']),
          description: find(['description', 'desc', 'name', 'memo', 'narration', 'details']),
          amount: find(['amount', 'value', 'sum', 'credit', 'debit']),
          category: find(['category', 'cat', 'tag', 'group']),
          type: find(['type', 'transaction type', 'txtype', 'kind']),
        })

        setStep(2)
      },
    })
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file?.name.endsWith('.csv')) handleFile(file)
    },
    [handleFile],
  )

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const buildParsedRows = useCallback((): ParsedRow[] => {
    return rawRows.map(raw => {
      const errors: string[] = []

      const rawDate = columnMap.date ? (raw[columnMap.date] ?? '') : ''
      const parsedDate = parseDate(rawDate)
      if (!parsedDate) errors.push('Invalid date')

      const description = columnMap.description
        ? (raw[columnMap.description] ?? '').trim()
        : ''
      if (!description) errors.push('Missing description')

      const rawAmount = columnMap.amount ? (raw[columnMap.amount] ?? '') : ''
      const amount = parseAmount(rawAmount)
      if (amount === null) errors.push('Invalid amount')

      const category =
        (columnMap.category ? (raw[columnMap.category] ?? '').trim() : '') || 'Uncategorized'

      const rawType = columnMap.type ? (raw[columnMap.type] ?? '').trim() : ''
      const type: TxType = isValidTxType(rawType) ? rawType : 'Expense'

      return {
        date: parsedDate ?? '',
        description,
        amount: amount ?? 0,
        category,
        type,
        valid: errors.length === 0,
        errors,
      }
    })
  }, [rawRows, columnMap])

  const handleGoToReview = () => {
    setParsedRows(buildParsedRows())
    setStep(3)
  }

  const handleImport = async () => {
    const validRows = parsedRows.filter(r => r.valid)
    setImporting(true)
    setImportProgress(0)

    let imported = 0
    let failed = 0

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i]
      const signedAmount =
        row.type === 'Income' ? Math.abs(row.amount) : -Math.abs(row.amount)

      try {
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: row.date,
            description: row.description,
            category: row.category,
            type: row.type === 'Transfer' ? 'Expense' : row.type,
            amount: signedAmount,
            source: 'ACCOUNT',
            recurrence: 'NONE',
          }),
        })
        if (res.ok) {
          imported++
        } else {
          failed++
        }
      } catch {
        failed++
      }

      setImportProgress(i + 1)
    }

    setImporting(false)
    setImportSummary({ imported, failed })
    onImported(imported)
  }

  if (!isOpen) return null

  const validCount = parsedRows.filter(r => r.valid).length
  const invalidCount = parsedRows.filter(r => !r.valid).length
  const canProceedFromStep2 =
    columnMap.date !== '' && columnMap.description !== '' && columnMap.amount !== ''

  const stepLabels = ['Upload', 'Map columns', 'Review'] as const

  return (
    <div
      className="bl-scrim"
      onClick={() => {
        if (!importing) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="csv-modal-title"
        className={`bl-modal ${step === 1 ? 'max-w-[540px]' : 'bl-modal--wide'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bl-modal__head">
          <div>
            <h2 id="csv-modal-title" className="bl-modal__title">
              Import CSV
            </h2>
            <p className="bl-modal__sub">
              {step === 1 && 'Upload a CSV file to bulk-import transactions.'}
              {step === 2 && 'Map your CSV columns to transaction fields.'}
              {step === 3 && 'Review your data before confirming the import.'}
            </p>
          </div>
          <button
            type="button"
            className="bl-icon-btn"
            onClick={onClose}
            disabled={importing}
            aria-label="Close modal"
          >
            <X aria-hidden="true" />
          </button>
        </div>

        {/* Steps */}
        <ol className="grid grid-cols-3 gap-2">
          {stepLabels.map((label, i) => {
            const s = (i + 1) as Step
            return (
              <li key={label} aria-current={step === s ? 'step' : undefined}>
                <span className={`block h-[3px] rounded-full ${step >= s ? 'bg-ink' : 'bg-line'}`} />
                <span className={`bl-eyebrow mt-2 block text-[0.6875rem] ${step >= s ? 'text-ink' : ''}`}>
                  {s} · {label}
                </span>
              </li>
            )
          })}
        </ol>

        {/* Step 1: Upload */}
        {step === 1 && (
          <div
            role="button"
            tabIndex={0}
            className={`flex cursor-pointer flex-col items-center gap-4 rounded-bl-lg border border-dashed px-6 py-11 text-center transition-colors ${
              isDragging
                ? 'border-brand bg-brand-soft'
                : 'border-line-strong hover:border-ink-faint hover:bg-sunk/50'
            }`}
            onDragOver={e => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                fileInputRef.current?.click()
              }
            }}
          >
            <span className="grid size-11 place-items-center rounded-bl-md bg-sunk text-ink">
              <Upload aria-hidden="true" className="size-5" />
            </span>
            <div>
              <p className="font-medium">Drag and drop a CSV file, or click to browse</p>
              <p className="mt-1 text-sm text-ink-muted">Supports .csv files only</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileInput}
            />
          </div>
        )}

        {/* Step 2: Map columns */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            {/* CSV preview */}
            <div>
              <p className="bl-eyebrow mb-2.5">Preview · first 3 rows</p>
              <div className="bl-table-wrap overflow-x-auto rounded-bl-md">
                <table className="bl-table bl-table--dense">
                  <thead>
                    <tr>
                      {headers.map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rawRows.slice(0, 3).map((row, i) => (
                      <tr key={i}>
                        {headers.map(h => (
                          <td key={h} className="whitespace-nowrap">
                            {row[h] ?? '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Column mapping */}
            <div>
              <p className="bl-eyebrow mb-2.5">Map columns</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(
                  [
                    { key: 'date', required: true },
                    { key: 'description', required: true },
                    { key: 'amount', required: true },
                    { key: 'category', required: false },
                    { key: 'type', required: false },
                  ] as { key: keyof ColumnMap; required: boolean }[]
                ).map(field => (
                  <label key={field.key} className="bl-field">
                    <span>
                      {FIELD_LABELS[field.key]}
                      {field.required ? (
                        <span className="ml-1 text-negative" aria-hidden="true">
                          *
                        </span>
                      ) : (
                        <span className="bl-field__hint ml-1">(optional)</span>
                      )}
                    </span>
                    <span className="relative block">
                      <select
                        value={columnMap[field.key]}
                        onChange={e =>
                          setColumnMap(prev => ({ ...prev, [field.key]: e.target.value }))
                        }
                        className={`bl-input appearance-none pr-9 ${columnMap[field.key] ? '' : 'bl-placeholder'}`}
                      >
                        <option value="">Not mapped</option>
                        {headers.map(h => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        aria-hidden="true"
                        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-faint"
                      />
                    </span>
                    {!field.required && field.key === 'category' && (
                      <span className="bl-field__hint">Defaults to &quot;Uncategorized&quot;</span>
                    )}
                    {!field.required && field.key === 'type' && (
                      <span className="bl-field__hint">Defaults to &quot;Expense&quot;</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && !importSummary && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2.5 text-sm">
              <span className="bl-chip bl-chip--accent">{validCount} valid</span>
              {invalidCount > 0 && <span className="bl-chip bl-chip--neg">{invalidCount} invalid</span>}
              <span className="text-ink-muted">Only valid rows will be imported.</span>
            </div>

            {importing && (
              <div className="flex flex-col gap-2">
                <div className="bl-meta flex justify-between">
                  <span>Importing…</span>
                  <span>
                    {importProgress} / {validCount}
                  </span>
                </div>
                <div className="bl-bar">
                  <i style={{ width: `${(importProgress / validCount) * 100}%` }} />
                </div>
              </div>
            )}

            <div className="bl-table-wrap max-h-72 overflow-y-auto rounded-bl-md">
              <table className="bl-table bl-table--dense">
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th className="text-right">Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((row, i) => (
                    <tr key={i} className={row.valid ? '' : 'bg-negative-soft text-negative'}>
                      <td className="bl-mono whitespace-nowrap">{row.date || '—'}</td>
                      <td className="max-w-[12rem] truncate">{row.description || '—'}</td>
                      <td className="whitespace-nowrap">{row.category}</td>
                      <td className="whitespace-nowrap">{row.type}</td>
                      <td className="text-right whitespace-nowrap">{formatCurrency(row.amount)}</td>
                      <td className="whitespace-nowrap">
                        {row.valid ? (
                          <Check aria-label="Valid" className="size-4 text-positive" />
                        ) : (
                          <span title={row.errors.join(', ')} className="cursor-help">
                            {row.errors.join(', ')}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Import summary */}
        {importSummary && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-brand-soft text-brand-ink">
              <Check aria-hidden="true" className="size-6" />
            </span>
            <div>
              <p className="bl-modal__title">Import complete</p>
              <p className="bl-modal__sub">
                {importSummary.imported} imported
                {importSummary.failed > 0 && `, ${importSummary.failed} failed`}
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bl-modal__foot">
          {importSummary ? (
            <button type="button" className="bl-btn bl-btn--sm bl-btn--primary" onClick={onClose}>
              Done
            </button>
          ) : (
            <>
              {step === 2 && (
                <button
                  type="button"
                  className="bl-btn bl-btn--sm bl-btn--quiet mr-auto"
                  onClick={() => setStep(1)}
                >
                  Back
                </button>
              )}
              {step === 3 && !importing && (
                <button
                  type="button"
                  className="bl-btn bl-btn--sm bl-btn--quiet mr-auto"
                  onClick={() => setStep(2)}
                >
                  Back
                </button>
              )}
              <button
                type="button"
                className="bl-btn bl-btn--sm bl-btn--ghost"
                onClick={onClose}
                disabled={importing}
              >
                Cancel
              </button>
              {step === 2 && (
                <button
                  type="button"
                  disabled={!canProceedFromStep2}
                  className="bl-btn bl-btn--sm bl-btn--primary"
                  onClick={handleGoToReview}
                >
                  Review import
                </button>
              )}
              {step === 3 && !importing && (
                <button
                  type="button"
                  disabled={validCount === 0}
                  className="bl-btn bl-btn--sm bl-btn--primary"
                  onClick={handleImport}
                >
                  Import {validCount} transaction{validCount !== 1 ? 's' : ''}
                </button>
              )}
              {step === 3 && importing && (
                <button type="button" disabled className="bl-btn bl-btn--sm bl-btn--primary">
                  Importing…
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
