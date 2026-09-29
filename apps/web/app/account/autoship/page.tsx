import { CalendarClock, CreditCard, MapPin, Repeat, Store } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { AutoshipActions } from '@/components/account/autoship-actions'
import { Thumb } from '@/components/account/order-card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { getAutoships } from '@/lib/account/data'
import { cents, describeEvery, formatDate, isoDay } from '@/lib/account/format'
import { requireUser } from '@/lib/account/session'
import { cn } from '@/lib/utils'
import { getProductThumbs } from '@/sanity/lib/fetchers'

export const metadata: Metadata = { title: 'Autoship' }

const BADGE = {
  active: { label: 'Active', className: 'bg-brand/10 text-brand-dark' },
  paused: { label: 'Paused', className: 'bg-muted text-muted-foreground' },
  past_due: { label: 'Payment problem', className: 'bg-destructive/10 text-destructive' }
} as const

export default async function AutoshipPage() {
  await requireUser('/account/autoship')
  const { autoships, available } = await getAutoships()
  const thumbs = await getProductThumbs(
    autoships.flatMap((a) => a.lines.map((l) => l.productId ?? ''))
  )
  const now = Math.floor(Date.now() / 1000)
  const minDate = isoDay(now + 86400)
  const maxDate = isoDay(now + 365 * 86400)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl tracking-tight md:text-2xl">Autoship</h2>
        <p className="text-sm text-muted-foreground">
          Change how often it comes, move your next order, pause or cancel any time.
        </p>
      </div>

      {!available && (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Autoship management isn’t available right now. Please call us for changes.
        </p>
      )}

      {available && autoships.length === 0 && (
        <div className="flex flex-col items-center rounded-xl border border-dashed px-6 py-14 text-center">
          <span className="mb-4 grid size-14 place-items-center rounded-full bg-muted">
            <Repeat className="size-7 text-muted-foreground" aria-hidden />
          </span>
          <p className="font-semibold">No Autoship yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Turn on Autoship in your cart to get food delivered on your schedule, with 20% off your
            first Autoship order.
          </p>
          <Button asChild className="mt-5">
            <Link href="/shop">Shop now</Link>
          </Button>
        </div>
      )}

      {autoships.map((a) => {
        const badge = BADGE[a.status]
        const total = a.lines.reduce((sum, l) => sum + l.unitAmount * l.quantity, 0)
        return (
          <article key={a.id} className="overflow-hidden rounded-xl border bg-card">
            <header className="flex flex-col gap-3 bg-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-6 md:py-4">
              <dl className="grid grid-cols-2 gap-4 sm:flex sm:gap-8">
                <div>
                  <dt className="text-xs text-muted-foreground">Schedule</dt>
                  <dd className="font-semibold">{describeEvery(a.count, a.interval)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Next order</dt>
                  <dd className="font-medium">
                    {a.status === 'paused'
                      ? 'Paused'
                      : a.nextOrderAt
                        ? formatDate(a.nextOrderAt)
                        : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Each order</dt>
                  <dd className="font-semibold">
                    {cents(total)} <span className="text-xs font-normal">+ tax</span>
                  </dd>
                </div>
              </dl>
              <span
                className={cn(
                  'w-fit rounded-full px-2.5 py-1 text-xs font-semibold',
                  badge.className
                )}
              >
                {badge.label}
              </span>
            </header>

            <ul>
              {a.lines.map((line, index) => {
                const thumb = line.productId ? thumbs.get(line.productId) : undefined
                return (
                  <li key={line.itemId}>
                    {index > 0 && <Separator />}
                    <div className="flex items-center justify-between gap-4 p-4 md:px-6">
                      <div className="flex items-center gap-4">
                        <Thumb thumb={thumb} title={line.title} />
                        <div>
                          <h3 className="font-sans text-base font-semibold">
                            {thumb?.slug ? (
                              <Link href={`/shop/${thumb.slug}`} className="hover:text-brand">
                                {line.title}
                              </Link>
                            ) : (
                              line.title
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {[line.option, `Qty ${line.quantity}`].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold">
                        {cents(line.unitAmount * line.quantity)}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>

            <footer className="space-y-4 border-t px-4 py-4 md:px-6">
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  {a.fulfillment === 'pickup' ? (
                    <>
                      <Store className="size-4" aria-hidden /> Pick up in store
                    </>
                  ) : (
                    <>
                      <MapPin className="size-4" aria-hidden /> {a.address ?? 'Delivery'}
                    </>
                  )}
                </span>
                {a.cardLabel && (
                  <span className="inline-flex items-center gap-1.5">
                    <CreditCard className="size-4" aria-hidden /> {a.cardLabel}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <CalendarClock className="size-4" aria-hidden /> Since {formatDate(a.createdAt)}
                </span>
              </div>
              {a.status === 'past_due' && (
                <p className="text-sm text-destructive">
                  Your last payment didn’t go through. Update your card under Payment methods.
                </p>
              )}
              <AutoshipActions
                autoship={a}
                nextDate={a.nextOrderAt ? isoDay(a.nextOrderAt) : null}
                minDate={minDate}
                maxDate={maxDate}
              />
            </footer>
          </article>
        )
      })}
    </div>
  )
}
