'use client'

import { useEffect, useRef } from 'react'
import { Check, ChevronDown, Repeat, Search } from 'lucide-react'
import type { MonthFilter, TypeFilter } from '@/types/transactions'
import type { Dispatch, SetStateAction } from 'react'

type Props = {
  searchTerm: string
  setSearchTerm: (value: string) => void
  filterMonth: MonthFilter
  setFilterMonth: (value: MonthFilter) => void
  isMonthMenuOpen: boolean
  setIsMonthMenuOpen: Dispatch<SetStateAction<boolean>>
  setIsFilterTypeMenuOpen: Dispatch<SetStateAction<boolean>>
  filterType: TypeFilter
  setFilterType: (value: TypeFilter) => void
  isFilterTypeMenuOpen: boolean
  monthOptions: readonly MonthFilter[]
  typeOptions: readonly TypeFilter[]
  filterRecurring: boolean
  setFilterRecurring: (value: boolean) => void
}

export function TransactionsFilters({
  searchTerm,
  setSearchTerm,
  filterMonth,
  setFilterMonth,
  isMonthMenuOpen,
  setIsMonthMenuOpen,
  filterType,
  setFilterType,
  isFilterTypeMenuOpen,
  setIsFilterTypeMenuOpen,
  monthOptions,
  typeOptions,
  filterRecurring,
  setFilterRecurring,
}: Props) {
  const monthMenuRef = useRef<HTMLDivElement>(null)
  const filterTypeMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isMonthMenuOpen && !isFilterTypeMenuOpen) return
    const onClickAway = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node
      if (monthMenuRef.current && monthMenuRef.current.contains(target)) return
      if (filterTypeMenuRef.current && filterTypeMenuRef.current.contains(target)) return
      setIsMonthMenuOpen(false)
      setIsFilterTypeMenuOpen(false)
    }
    document.addEventListener('mousedown', onClickAway)
    document.addEventListener('touchstart', onClickAway)
    return () => {
      document.removeEventListener('mousedown', onClickAway)
      document.removeEventListener('touchstart', onClickAway)
    }
  }, [isMonthMenuOpen, isFilterTypeMenuOpen, setIsFilterTypeMenuOpen, setIsMonthMenuOpen])

  return (
    <div
      className="bl-rise relative z-20 flex flex-col gap-2.5 md:flex-row md:items-center"
      style={{ '--i': 1 } as React.CSSProperties}
    >
      <label className="bl-affix bl-affix--icon flex-1">
        <Search aria-hidden="true" />
        <input
          type="search"
          value={searchTerm}
          onChange={e => setSearchTerm(e.currentTarget.value)}
          placeholder="Search transactions"
          aria-label="Search transactions"
          className="bl-input bl-input--sm"
        />
      </label>
      <div className="grid grid-cols-2 gap-2.5 md:flex">
        <div className="relative md:w-40" ref={monthMenuRef}>
          <button
            type="button"
            onClick={() => setIsMonthMenuOpen(prev => !prev)}
            className="bl-input bl-input--sm"
            aria-haspopup="listbox"
            aria-expanded={isMonthMenuOpen}
          >
            {filterMonth}
            <ChevronDown aria-hidden="true" />
          </button>
          {isMonthMenuOpen && (
            <div className="bl-menu top-full left-0 mt-1.5" role="listbox">
              {monthOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  role="option"
                  aria-selected={option === filterMonth}
                  className="bl-menu__item"
                  onClick={() => { setFilterMonth(option); setIsMonthMenuOpen(false) }}
                >
                  {option}
                  {option === filterMonth && <Check aria-hidden="true" />}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="relative md:w-36" ref={filterTypeMenuRef}>
          <button
            type="button"
            onClick={() => setIsFilterTypeMenuOpen(prev => !prev)}
            className="bl-input bl-input--sm"
            aria-haspopup="listbox"
            aria-expanded={isFilterTypeMenuOpen}
          >
            {filterType}
            <ChevronDown aria-hidden="true" />
          </button>
          {isFilterTypeMenuOpen && (
            <div className="bl-menu top-full left-0 mt-1.5" role="listbox">
              {typeOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  role="option"
                  aria-selected={option === filterType}
                  className="bl-menu__item"
                  onClick={() => { setFilterType(option); setIsFilterTypeMenuOpen(false) }}
                >
                  {option}
                  {option === filterType && <Check aria-hidden="true" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <button
        type="button"
        aria-pressed={filterRecurring}
        onClick={() => setFilterRecurring(!filterRecurring)}
        className="bl-btn bl-btn--sm bl-btn--outline shrink-0"
      >
        <Repeat aria-hidden="true" />
        Recurring
      </button>
    </div>
  )
}
