import { formatCurrency } from '@/lib/currency'

/** Money as the app writes it. Formatting lives in lib/currency.ts. */
export const formatMoney = (value: number) => formatCurrency(value)
