import type { OrderStatus } from '@/lib/supabase/types'

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
export const cents = (amount: number) => usd.format(amount / 100)

const tz = 'America/Los_Angeles'
export const formatDate = (value: string | number) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: tz
  }).format(typeof value === 'number' ? new Date(value * 1000) : new Date(value))

/** yyyy-mm-dd in Las Vegas time, for date inputs */
export const isoDay = (unixSeconds: number) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date(unixSeconds * 1000))

export const STATUS: Record<
  OrderStatus,
  { label: string; tone: 'brand' | 'sky' | 'muted' | 'orange' }
> = {
  paid: { label: 'Preparing', tone: 'sky' },
  out_for_delivery: { label: 'Out for delivery', tone: 'sky' },
  delivered: { label: 'Delivered', tone: 'brand' },
  ready_for_pickup: { label: 'Ready for pick up', tone: 'sky' },
  picked_up: { label: 'Picked up', tone: 'brand' },
  cancelled: { label: 'Cancelled', tone: 'muted' },
  refunded: { label: 'Refunded', tone: 'orange' }
}

export const TONES = {
  brand: 'bg-brand/10 text-brand-dark',
  sky: 'bg-sky/10 text-sky-band',
  muted: 'bg-muted text-muted-foreground',
  orange: 'bg-orange/10 text-orange'
} as const

export const describeEvery = (count: number, interval: string) =>
  count === 1 ? `Every ${interval}` : `Every ${count} ${interval}s`
