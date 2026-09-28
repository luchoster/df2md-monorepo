/**
 * Order math shared by the cart (display) and the checkout API (authoritative, with prices
 * re-read from Sanity). Money is handled in cents to avoid float drift.
 */

export type Interval = 'day' | 'week' | 'month'
export type AutoshipSchedule = { interval: Interval; count: number }

/** Stripe allows at most one year between recurring charges. */
export const MAX_INTERVAL_COUNT: Record<Interval, number> = { day: 365, week: 52, month: 12 }
export const DEFAULT_SCHEDULE: AutoshipSchedule = { interval: 'week', count: 4 }

export function clampSchedule(s: Partial<AutoshipSchedule> | null | undefined): AutoshipSchedule {
  const interval: Interval = s?.interval === 'day' || s?.interval === 'month' ? s.interval : 'week'
  const count = Math.min(
    MAX_INTERVAL_COUNT[interval],
    Math.max(1, Math.floor(Number(s?.count) || 1))
  )
  return { interval, count }
}

export function describeSchedule({ interval, count }: AutoshipSchedule) {
  return count === 1 ? `Every ${interval}` : `Every ${count} ${interval}s`
}

export type PricedLine = {
  unitAmount: number
  quantity: number
  autoship: boolean
  noDiscounts?: boolean | null
}

export type Totals = {
  subtotal: number
  autoshipSubtotal: number
  discount: number
  tax: number
  total: number
}

export const toCents = (dollars: number) => Math.round(dollars * 100)
export const fromCents = (cents: number) => cents / 100

/**
 * @param lines unit amounts in cents
 * @param discountPercent first-Autoship discount, applied to Autoship lines only (excluded brands skipped)
 * @param taxRatePercent flat sales tax on the discounted subtotal (delivery is free)
 */
export function computeTotals(
  lines: PricedLine[],
  { discountPercent = 0, taxRatePercent = 0, firstAutoship = true } = {}
): Totals {
  const subtotal = lines.reduce((n, l) => n + l.unitAmount * l.quantity, 0)
  const autoshipLines = lines.filter((l) => l.autoship)
  const autoshipSubtotal = autoshipLines.reduce((n, l) => n + l.unitAmount * l.quantity, 0)
  const discountable = autoshipLines
    .filter((l) => !l.noDiscounts)
    .reduce((n, l) => n + l.unitAmount * l.quantity, 0)
  const discount = firstAutoship ? Math.round((discountable * discountPercent) / 100) : 0
  const tax = Math.round(((subtotal - discount) * taxRatePercent) / 100)
  return { subtotal, autoshipSubtotal, discount, tax, total: subtotal - discount + tax }
}
