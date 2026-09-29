import { ChevronRight, Repeat, Store, Truck } from 'lucide-react'
import Link from 'next/link'
import { SanityImage } from '@/components/sanity-image'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cents, formatDate, STATUS, TONES } from '@/lib/account/format'
import { formatDeliveryDate } from '@/lib/delivery'
import type { OrderWithItems } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'
import type { ProductThumb } from '@/sanity/lib/fetchers'

export function StatusBadge({ status }: { status: OrderWithItems['status'] }) {
  const s = STATUS[status]
  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap',
        TONES[s.tone]
      )}
    >
      {s.label}
    </span>
  )
}

export function Thumb({ thumb, title }: { thumb?: ProductThumb; title: string }) {
  return (
    <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border bg-white md:size-20">
      {thumb?.mainImage?.asset ? (
        <SanityImage
          image={thumb.mainImage}
          alt={title}
          fill
          sizes="80px"
          className="!object-contain p-1.5"
        />
      ) : null}
    </div>
  )
}

/** shadcnblocks Order History 3 card: header strip with number/date/total, then the items. */
export function OrderCard({
  order,
  thumbs
}: {
  order: OrderWithItems
  thumbs: Map<string, ProductThumb>
}) {
  const href = `/account/orders/${order.number}`
  return (
    <article className="overflow-hidden rounded-xl border bg-card">
      <header className="flex flex-col gap-3 bg-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-6 md:py-4">
        <dl className="grid grid-cols-3 gap-4 sm:flex sm:gap-8">
          <div>
            <dt className="text-xs text-muted-foreground">Order</dt>
            <dd className="font-semibold">#{order.number}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Placed</dt>
            <dd className="font-medium">{formatDate(order.created_at)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Total</dt>
            <dd className="font-semibold">{cents(order.total)}</dd>
          </div>
        </dl>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          <Button asChild variant="outline" size="sm">
            <Link href={href}>
              View order
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </header>
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t px-4 py-2.5 text-sm text-muted-foreground md:px-6">
        <span className="inline-flex items-center gap-1.5">
          {order.fulfillment === 'pickup' ? (
            <Store className="size-4" aria-hidden />
          ) : (
            <Truck className="size-4" aria-hidden />
          )}
          {order.fulfillment === 'pickup' ? 'Pick up' : 'Delivery'}
          {order.delivery_date && ` · ${formatDeliveryDate(order.delivery_date)}`}
        </span>
        {order.kind === 'autoship_renewal' && (
          <span className="inline-flex items-center gap-1.5 text-sky">
            <Repeat className="size-4" aria-hidden />
            Autoship delivery
          </span>
        )}
      </p>
      <ul>
        {order.order_items.map((item, index) => {
          const thumb = item.product_id ? thumbs.get(item.product_id) : undefined
          return (
            <li key={item.id}>
              {index > 0 && <Separator />}
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
                <div className="flex gap-4">
                  <Thumb thumb={thumb} title={item.title} />
                  <div>
                    <h3 className="font-sans text-base font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {[item.option, `Qty ${item.quantity}`].filter(Boolean).join(' · ')}
                      {item.autoship && ' · Autoship'}
                    </p>
                    {thumb?.slug && (
                      <Button asChild variant="outline" size="sm" className="mt-2">
                        <Link href={`/shop/${thumb.slug}`}>Buy again</Link>
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-sm font-semibold sm:text-right">
                  {cents(item.unit_amount * item.quantity)}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </article>
  )
}
