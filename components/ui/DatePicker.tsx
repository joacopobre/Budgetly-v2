'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  value: string // YYYY-MM-DD
  onChange: (value: string) => void
  error?: boolean
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function formatDisplay(value: string): string {
  if (!value) return 'Select date'
  const [y, m, d] = value.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}

function todayStr(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function firstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function DatePicker({ value, onChange, error }: Props) {
  const today = todayStr()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const initialYear = value ? Number(value.split('-')[0]) : new Date().getFullYear()
  const initialMonth = value ? Number(value.split('-')[1]) - 1 : new Date().getMonth()
  const [viewYear, setViewYear] = useState(initialYear)
  const [viewMonth, setViewMonth] = useState(initialMonth)

  // Update view when value changes externally
  useEffect(() => {
    if (value) {
      setViewYear(Number(value.split('-')[0]))
      setViewMonth(Number(value.split('-')[1]) - 1)
    }
  }, [value])

  useEffect(() => {
    if (!isOpen) return
    const onClickAway = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickAway)
    document.addEventListener('touchstart', onClickAway)
    return () => {
      document.removeEventListener('mousedown', onClickAway)
      document.removeEventListener('touchstart', onClickAway)
    }
  }, [isOpen])

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(y => y - 1)
    } else {
      setViewMonth(m => m - 1)
    }
  }

  function nextMonth() {
    const nextMonthFirst = viewMonth === 11
      ? toDateStr(viewYear + 1, 0, 1)
      : toDateStr(viewYear, viewMonth + 1, 1)
    if (nextMonthFirst > today) return
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(y => y + 1)
    } else {
      setViewMonth(m => m + 1)
    }
  }

  const totalDays = daysInMonth(viewYear, viewMonth)
  const startDay = firstDayOfWeek(viewYear, viewMonth)

  // Check if next month navigation should be disabled
  const nextMonthFirst = viewMonth === 11
    ? toDateStr(viewYear + 1, 0, 1)
    : toDateStr(viewYear, viewMonth + 1, 1)
  const canGoNext = nextMonthFirst <= today

  // Build calendar cells (nulls for padding before day 1)
  const cells: (number | null)[] = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ]

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="bl-input"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-invalid={!!error && !isOpen}
      >
        <span className={cn('truncate', !value && 'bl-placeholder')}>{formatDisplay(value)}</span>
        <ChevronDown aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="bl-menu top-full left-0 mt-1.5 w-72 min-w-0 p-3" role="dialog" aria-label="Choose date">
          {/* Month navigation */}
          <div className="mb-2 flex items-center justify-between">
            <button type="button" onClick={prevMonth} className="bl-icon-btn size-8" aria-label="Previous month">
              <ChevronLeft aria-hidden="true" />
            </button>
            <span className="text-sm font-medium">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              disabled={!canGoNext}
              className="bl-icon-btn size-8"
              aria-label="Next month"
            >
              <ChevronRight aria-hidden="true" />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="mb-1 grid grid-cols-7 gap-0.5">
            {DAYS.map(d => (
              <div key={d} className="bl-meta py-1 text-center text-[0.625rem]">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) => {
              if (day === null) return <div key={`pad-${i}`} />
              const dateStr = toDateStr(viewYear, viewMonth, day)
              const isSelected = dateStr === value
              const isToday = dateStr === today
              const isFuture = dateStr > today
              return (
                <button
                  key={day}
                  type="button"
                  disabled={isFuture}
                  aria-pressed={isSelected}
                  onClick={() => {
                    onChange(dateStr)
                    setIsOpen(false)
                  }}
                  className={cn(
                    'flex h-8 w-full items-center justify-center rounded-bl-sm text-sm tabular-nums transition-colors',
                    isFuture ? 'cursor-not-allowed text-ink-faint/50' : 'cursor-pointer hover:bg-sunk',
                    isSelected && 'bg-ink font-medium text-canvas hover:bg-ink',
                    isToday && !isSelected && 'font-semibold text-brand-ink',
                  )}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {/* Today shortcut */}
          <div className="mt-2 border-t border-line pt-2">
            <button
              type="button"
              onClick={() => {
                onChange(today)
                setIsOpen(false)
              }}
              className="bl-btn bl-btn--xs bl-btn--quiet w-full"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
