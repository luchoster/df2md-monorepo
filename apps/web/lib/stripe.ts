import 'server-only'
import Stripe from 'stripe'

/** null until STRIPE_SECRET_KEY is set: every caller must handle "payments not configured". */
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

const TAX_RATE_KEY = 'df2md-sales-tax'
let taxRateCache: { percent: number; id: string } | null = null

/** Finds (or creates once) the Stripe tax rate for the percentage in Site settings. */
export async function getTaxRateId(s: Stripe, percent: number) {
  if (taxRateCache?.percent === percent) return taxRateCache.id
  const rates = await s.taxRates.list({ active: true, limit: 100 })
  let rate = rates.data.find(
    (r) => r.metadata?.key === TAX_RATE_KEY && r.percentage === percent && !r.inclusive
  )
  rate ??= await s.taxRates.create({
    display_name: 'Sales tax',
    description: 'Clark County, NV',
    jurisdiction: 'NV',
    country: 'US',
    percentage: percent,
    inclusive: false,
    metadata: { key: TAX_RATE_KEY }
  })
  taxRateCache = { percent, id: rate.id }
  return rate.id
}

/** A returning customer (same email) keeps their saved cards and Autoship history. */
export async function findCustomer(s: Stripe, email: string) {
  const found = await s.customers.list({ email: email.toLowerCase(), limit: 1 })
  return found.data[0] ?? null
}

/** First-Autoship discount is once per customer; the webhook sets this flag after payment. */
export const FIRST_AUTOSHIP_FLAG = 'first_autoship_redeemed'
