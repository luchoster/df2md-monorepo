'use client'

import { Minus, Plus, Repeat, ShoppingCart, Trash2, Truck } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDeliveryDate } from '@/lib/delivery'
import { formatPrice } from '@/lib/format'
import {
  computeTotals,
  describeSchedule,
  fromCents,
  type Interval,
  MAX_INTERVAL_COUNT,
  toCents
} from '@/lib/pricing'
import { cn } from '@/lib/utils'
import { useCart } from './cart-provider'

export type CartSettings = {
  discountPercent: number
  taxRatePercent: number
  deliveryDate: string
  pickupEnabled: boolean
}

/**
 * shadcnblocks Shopping Cart 2 (item cards + order summary) extended with a one-time / Autoship
 * switch per item and the order's Autoship schedule (one schedule per order).
 */
export function CartView({ settings }: { settings: CartSettings }) {
  const { ready, items, setQuantity, remove, setAutoship, schedule, setSchedule, count } = useCart()
  const hasAutoship = items.some((i) => i.autoship)
  const totals = computeTotals(
    items.map((i) => ({
      unitAmount: toCents(i.price),
      quantity: i.quantity,
      autoship: i.autoship,
      noDiscounts: i.noDiscounts
    })),
    { discountPercent: settings.discountPercent, taxRatePercent: settings.taxRatePercent }
  )

  if (!ready) return <CartSkeleton />
  if (!items.length)
    return (
      <section className="container max-w-lg py-24 text-center">
        <ShoppingCart className="mx-auto mb-6 size-12 text-muted-foreground" />
        <h1 className="mb-3 text-3xl">Your cart is empty</h1>
        <p className="mb-8 text-muted-foreground">Looks like you haven't added anything yet.</p>
        <Button asChild size="lg">
          <Link href="/shop">Continue shopping</Link>
        </Button>
      </section>
    )

  return (
    <section className="container py-10 md:py-14 xl:max-w-[1200px]">
      <h1 className="mb-8 text-3xl md:text-4xl">Shopping Cart</h1>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 rounded-xl border bg-card p-4">
              <Link
                href={`/shop/${item.slug}`}
                className="relative size-20 shrink-0 overflow-hidden rounded-lg border bg-white sm:size-24"
              >
                {item.imageUrl && (
                  <Image
                    src={item.imageUrl}
                    alt=""
                    fill
                    sizes="96px"
                    className="object-contain p-1"
                  />
                )}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                <div>
                  <Link
                    href={`/shop/${item.slug}`}
                    className="line-clamp-2 font-semibold text-foreground hover:text-primary"
                  >
                    {item.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">{item.option}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => setQuantity(item.id, item.quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      <Minus />
                    </Button>
                    <span className="w-8 text-center font-semibold tabular-nums">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => setQuantity(item.id, item.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      <Plus />
                    </Button>
                  </div>
                  <fieldset
                    className="inline-flex rounded-md border p-0.5 text-xs font-semibold"
                    aria-label="Purchase type"
                  >
                    <button
                      type="button"
                      onClick={() => setAutoship(item.id, false)}
                      aria-pressed={!item.autoship}
                      className={cn(
                        'rounded px-2.5 py-1',
                        !item.autoship
                          ? 'bg-foreground text-background'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      One-time
                    </button>
                    <button
                      type="button"
                      onClick={() => setAutoship(item.id, true)}
                      aria-pressed={item.autoship}
                      className={cn(
                        'flex items-center gap-1 rounded px-2.5 py-1',
                        item.autoship
                          ? 'bg-sky text-white'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Repeat className="size-3" /> Autoship
                    </button>
                  </fieldset>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between">
                <div className="text-right">
                  <p className="font-bold">{formatPrice(item.price * item.quantity)}</p>
                  {item.quantity > 1 && (
                    <p className="text-xs text-muted-foreground">{formatPrice(item.price)} each</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => remove(item.id)}
                >
                  <Trash2 /> <span className="max-sm:sr-only">Remove</span>
                </Button>
              </div>
            </div>
          ))}

          {hasAutoship && (
            <div className="rounded-xl border border-sky/40 bg-sky/5 p-5">
              <h2 className="mb-1 flex items-center gap-2 text-lg text-sky">
                <Repeat className="size-5" /> Autoship schedule
              </h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Your Autoship items ship together. Change or pause it anytime from your account.
              </p>
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="autoship-count">Deliver every</Label>
                  <Input
                    id="autoship-count"
                    type="number"
                    min={1}
                    max={MAX_INTERVAL_COUNT[schedule.interval]}
                    value={schedule.count}
                    onChange={(e) => setSchedule({ ...schedule, count: Number(e.target.value) })}
                    className="w-24 bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="autoship-unit" className="sr-only">
                    Unit
                  </Label>
                  <Select
                    value={schedule.interval}
                    onValueChange={(v) => setSchedule({ ...schedule, interval: v as Interval })}
                  >
                    <SelectTrigger id="autoship-unit" className="w-32 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Days</SelectItem>
                      <SelectItem value="week">Weeks</SelectItem>
                      <SelectItem value="month">Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="pb-2 text-sm font-semibold text-foreground">
                  {describeSchedule(schedule)}
                </p>
              </div>
            </div>
          )}
        </div>

        <aside className="lg:col-span-1">
          <div className="sticky top-4 rounded-xl border bg-card p-6">
            <h2 className="mb-4 text-lg">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <ShoppingCart className="size-4" /> {count} {count === 1 ? 'item' : 'items'}
              </div>
              <Row label="Subtotal" value={formatPrice(fromCents(totals.subtotal))} />
              {totals.discount > 0 && (
                <Row
                  label={`First Autoship (${settings.discountPercent}% off)`}
                  value={`−${formatPrice(fromCents(totals.discount))}`}
                  className="text-primary"
                />
              )}
              <Row label="Delivery" value="Free" />
              <Row
                label={`Estimated tax (${settings.taxRatePercent}%)`}
                value={formatPrice(fromCents(totals.tax))}
              />
              <Separator />
              <Row
                label="Total"
                value={formatPrice(fromCents(totals.total))}
                className="text-base font-bold text-foreground"
              />
            </div>
            <Button asChild size="lg" className="mt-6 w-full text-base">
              <Link href="/checkout">Proceed to Checkout</Link>
            </Button>
            <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
              <Truck className="mt-0.5 size-4 shrink-0 text-primary" />
              Free delivery {formatDeliveryDate(settings.deliveryDate)}
              {settings.pickupEnabled && ' · or pick up in store'}
            </p>
            {totals.discount > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                The Autoship discount applies if this is your first Autoship order; it's confirmed
                at checkout.
              </p>
            )}
          </div>
        </aside>
      </div>
    </section>
  )
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn('flex justify-between gap-4 text-muted-foreground', className)}>
      <span>{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  )
}

export function CartSkeleton() {
  return (
    <section className="container py-14">
      <Skeleton className="mb-8 h-10 w-64" />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-72" />
      </div>
    </section>
  )
}
