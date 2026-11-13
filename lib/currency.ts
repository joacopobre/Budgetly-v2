/**
 * Currency display — the one place that decides how money is written.
 *
 * Display/formatting only: amounts are stored and calculated as plain numbers,
 * and nothing here touches the database or business logic.
 *
 * To add a currency picker later: make `activeCurrency` come from user
 * preferences (context/cookie) and pass it as `options.currency`. Every caller
 * already goes through `formatCurrency`, so no component needs to change.
 */

export type CurrencyCode = 'GBP' | 'USD' | 'EUR'

export type Currency = {
  code: CurrencyCode
  symbol: string
  locale: string
}

export const CURRENCIES: Record<CurrencyCode, Currency> = {
  GBP: { code: 'GBP', symbol: '£', locale: 'en-GB' },
  USD: { code: 'USD', symbol: '$', locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', locale: 'en-IE' },
}

/** The currency Budgetly displays today. Change this one line to switch the product. */
export const DEFAULT_CURRENCY: Currency = CURRENCIES.GBP

export type FormatCurrencyOptions = {
  currency?: Currency
  /** 'auto' drops ".00" on whole amounts; 'always' keeps two decimals; 'never' rounds. */
  decimals?: 'auto' | 'always' | 'never'
  /** Prefix positive amounts with "+". */
  signed?: boolean
  /** 12,400 → "12.4k". For chart axes and tight spaces. */
  compact?: boolean
}

export function formatCurrency(value: number, options: FormatCurrencyOptions = {}): string {
  const { currency = DEFAULT_CURRENCY, decimals = 'always', signed = false, compact = false } = options
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : signed && value > 0 ? '+' : ''

  if (compact) {
    if (abs >= 1_000_000) return `${sign}${currency.symbol}${trim(abs / 1_000_000)}M`
    if (abs >= 1_000) return `${sign}${currency.symbol}${trim(abs / 1_000)}k`
    return `${sign}${currency.symbol}${Math.round(abs)}`
  }

  const isWhole = Math.round(abs * 100) % 100 === 0
  const fractionDigits = decimals === 'never' || (decimals === 'auto' && isWhole) ? 0 : 2
  const number = abs.toLocaleString(currency.locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
  return `${sign}${currency.symbol}${number}`
}

function trim(n: number): string {
  return n.toFixed(1).replace(/\.0$/, '')
}
