import { ArrowLeft, Clock, MapPin, Package, Receipt, Repeat, Store, Truck } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { StatusBadge, Thumb } from '@/components/account/order-card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { getOrder } from '@/lib/account/data'
import { cents, formatDate } from '@/lib/account/format'
import { requireUser } from '@/lib/account/session'
import { formatDeliveryDate, formatSlot } from '@/lib/delivery'
import { formatPhone, formatPhoneHref } from '@/lib/format'
import { getProductThumbs, getSettings } from '@/sanity/lib/fetchers'

export async function generateMetadata({
  params
}: PageProps<'/account/orders/[number]'>): Promise<Metadata> {
  return { title: `Order #${(await params).number}` }
}

function Panel({
  icon: Icon,
  title,
  children
}: {
  icon: typeof Package
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border bg-card p-5 md:p-6">
      <h2 className="mb-4 flex items-center gap-2 font-sans text-base font-semibold">
        <Icon className="size-5 text-muted-foreground" aria-hidden />
        {title}
      </h2>
      {children}
    </section>
  )
}

/** shadcnblocks Order Summary 1: info bar, items + totals on the left, delivery on the right. */
export default async function OrderPage({ params }: PageProps<'/account/orders/[number]'>) {
  const { number } = await params
  await requireUser(`/account/orders/${number}`)
  const order = /^\d+$/.test(number) ? await getOrder(Number(number)) : null
  if (!order) notFound()
  const [thumbs, settings] = await Promise.all([
    getProductThumbs(order.order_items.map((i) => i.product_id ?? '')),
    getSettings()
  ])
  const phone = settings?.contact?.phone ?? '702-971-2484'
  const pickup = order.fulfillment === 'pickup'

  return (
    <div className="space-y-6">
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        All orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-4 md:p-6">
        <dl className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div>
            <dt className="text-sm text-muted-foreground">Order</dt>
            <dd className="text-lg font-semibold">#{order.number}</dd>
          </div>
          <Separator orientation="vertical" className="hidden h-10 md:block" />
          <div>
            <dt className="text-sm text-muted-foreground">Placed</dt>
            <dd className="font-medium">{formatDate(order.created_at)}</dd>
          </div>
          {order.kind === 'autoship_renewal' && (
            <>
              <Separator orientation="vertical" className="hidden h-10 md:block" />
              <div className="flex items-center gap-1.5 text-sm font-medium text-sky">
                <Repeat className="size-4" aria-hidden />
                Autoship delivery
              </div>
            </>
          )}
        </dl>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Panel icon={Package} title="Items">
            <ul className="space-y-4">
              {order.order_items.map((item, index) => {
                const thumb = item.product_id ? thumbs.get(item.product_id) : undefined
                return (
                  <li key={item.id}>
                    {index > 0 && <Separator className="mb-4" />}
                    <div className="flex gap-4">
                      <Thumb thumb={thumb} title={item.title} />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-sans text-base font-semibold">
                          {thumb?.slug ? (
                            <Link href={`/shop/${thumb.slug}`} className="hover:text-brand">
                              {item.title}
                            </Link>
                          ) : (
                            item.title
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {[item.option, item.autoship && 'Autoship'].filter(Boolean).join(' · ')}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">Qty {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{cents(item.unit_amount * item.quantity)}</p>
                        {item.quantity > 1 && (
                          <p className="text-sm text-muted-foreground">
                            {cents(item.unit_amount)} each
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </Panel>

          <Panel icon={Receipt} title="Summary">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{cents(order.subtotal)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-brand-dark">
                  <dt>First Autoship discount</dt>
                  <dd>−{cents(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{pickup ? 'Pick up' : 'Delivery'}</dt>
                <dd>Free</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Tax</dt>
                <dd>{cents(order.tax)}</dd>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <dt>Total paid</dt>
                <dd>{cents(order.total)}</dd>
              </div>
            </dl>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel icon={pickup ? Store : Truck} title={pickup ? 'Pick up' : 'Delivery'}>
            <div className="space-y-3 text-sm">
              {order.delivery_date && (
                <p className="font-medium">{formatDeliveryDate(order.delivery_date)}</p>
              )}
              {order.requested_time && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="size-4" aria-hidden />
                  Around {formatSlot(order.requested_time)}
                </p>
              )}
              {pickup ? (
                <p className="whitespace-pre-line text-muted-foreground">
                  {settings?.contact?.address ??
                    '1550 W. Horizon Ridge Pkwy, Suite N\nHenderson, NV 89012'}
                </p>
              ) : (
                order.address && (
                  <p className="flex gap-2 text-muted-foreground">
                    <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <span>
                      {order.customer_name && (
                        <span className="block font-medium text-foreground">
                          {order.customer_name}
                        </span>
                      )}
                      {order.address}
                    </span>
                  </p>
                )
              )}
              {order.notes && <p className="text-muted-foreground">Notes: {order.notes}</p>}
              {order.autoship_schedule && (
                <p className="flex items-center gap-2 text-sky">
                  <Repeat className="size-4" aria-hidden />
                  Autoship: {order.autoship_schedule.toLowerCase()}
                </p>
              )}
            </div>
          </Panel>

          <div className="rounded-xl border bg-card p-5 text-sm md:p-6">
            <p className="mb-3 text-muted-foreground">Questions about this order?</p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <a href={formatPhoneHref(phone)}>Call {formatPhone(phone)}</a>
              </Button>
              {order.autoship_schedule && (
                <Button asChild variant="outline" size="sm">
                  <Link href="/account/autoship">Manage Autoship</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
