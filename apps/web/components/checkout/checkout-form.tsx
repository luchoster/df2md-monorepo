'use client'

import { AlertTriangle, Lock, MapPin, Pencil, Repeat, Store, Truck } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useCart } from '@/components/cart/cart-provider'
import { CartSkeleton } from '@/components/cart/cart-view'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import type { CheckoutQuote, CheckoutRequest, CheckoutResponse } from '@/lib/checkout/schema'
import { formatDeliveryDate, formatSlot, timeSlots } from '@/lib/delivery'
import { formatPrice } from '@/lib/format'
import { computeTotals, describeSchedule, fromCents, toCents } from '@/lib/pricing'
import { cn } from '@/lib/utils'
import { PaymentStep } from './payment-step'

export type CheckoutSettings = {
  discountPercent: number
  taxRatePercent: number
  deliveryDate: string
  pickupEnabled: boolean
  pickupNote: string
  storeAddress: string
  allowTimeRequest: boolean
  timeWindow: { start: string; end: string; slotMinutes: number }
}

/** Prefill from the signed-in customer's profile (null for guests). */
export type CheckoutCustomer = {
  name: string
  email: string
  phone: string
  line1: string
  line2: string
  city: string
  postalCode: string
  notes: string
}

type Errors = Record<string, string>

/**
 * shadcnblocks Checkout 10 layout (details + delivery on the left, cart summary on the right),
 * posting to /api/checkout which re-prices everything server-side and hands off to Stripe.
 */
export function CheckoutForm({
  settings,
  customer,
  accountsEnabled
}: {
  settings: CheckoutSettings
  customer: CheckoutCustomer | null
  accountsEnabled: boolean
}) {
  const { ready, items, schedule } = useCart()
  const [method, setMethod] = useState<'delivery' | 'pickup'>('delivery')
  const [time, setTime] = useState('any')
  const [errors, setErrors] = useState<Errors>({})
  const [problems, setProblems] = useState<string[]>([])
  const [verified, setVerified] = useState<CheckoutQuote | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  /** Set once the server has verified the order and created the Stripe session */
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  if (!ready) return <CartSkeleton />
  if (!items.length)
    return (
      <section className="container max-w-lg py-24 text-center">
        <h1 className="mb-3 text-3xl">Your cart is empty</h1>
        <p className="mb-8 text-muted-foreground">Add something before checking out.</p>
        <Button asChild size="lg">
          <Link href="/shop">Continue shopping</Link>
        </Button>
      </section>
    )

  const hasAutoship = items.some((i) => i.autoship)
  const estimate = computeTotals(
    items.map((i) => ({
      unitAmount: toCents(i.price),
      quantity: i.quantity,
      autoship: i.autoship,
      noDiscounts: i.noDiscounts
    })),
    { discountPercent: settings.discountPercent, taxRatePercent: settings.taxRatePercent }
  )
  const totals = verified ?? estimate
  const slots = timeSlots(
    settings.timeWindow.start,
    settings.timeWindow.end,
    settings.timeWindow.slotMinutes
  )

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const get = (k: string) => String(form.get(k) ?? '').trim()
    const body: CheckoutRequest = {
      items: items.map((i) => ({
        productId: i.productId,
        variantKey: i.variantKey,
        quantity: i.quantity,
        autoship: i.autoship
      })),
      schedule,
      customer: { name: get('name'), email: get('email'), phone: get('phone') },
      fulfillment:
        method === 'pickup'
          ? { method: 'pickup', notes: get('notes') || undefined }
          : {
              method: 'delivery',
              address: {
                line1: get('line1'),
                line2: get('line2') || undefined,
                city: get('city'),
                state: 'NV',
                postalCode: get('postalCode')
              },
              requestedTime: time !== 'any' ? time : undefined,
              notes: get('notes') || undefined
            }
    }
    setSubmitting(true)
    setErrors({})
    setProblems([])
    setMessage(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = (await res.json()) as CheckoutResponse
      if (data.ok) {
        setVerified(data.quote)
        setClientSecret(data.clientSecret)
        requestAnimationFrame(() =>
          document.getElementById('payment')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        )
        return
      }
      if (data.error === 'invalid') {
        const map: Errors = {}
        for (const i of data.issues) map[i.path.split('.').pop() ?? i.path] = i.message
        setErrors(map)
      } else if (data.error === 'cart_changed') setProblems(data.problems)
      else if (data.error === 'payments_not_configured') {
        setVerified(data.quote)
        setMessage(
          'Online payments are not connected yet. Your order details and prices were verified. Please call us to place this order for now.'
        )
      } else setMessage(data.message)
    } catch {
      setMessage('Something went wrong. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="container py-10 md:py-14 xl:max-w-[1200px]">
      <form onSubmit={onSubmit} noValidate>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h1 className="text-3xl md:text-4xl">Checkout</h1>
              {accountsEnabled && !customer && (
                <p className="text-sm text-muted-foreground">
                  Have an account?{' '}
                  <Link
                    href="/login?next=/checkout"
                    className="font-medium text-brand hover:underline"
                  >
                    Sign in
                  </Link>{' '}
                  for faster checkout.
                </p>
              )}
            </div>

            <Panel title="Contact" disabled={!!clientSecret}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Text
                  name="name"
                  label="Full name"
                  autoComplete="name"
                  defaultValue={customer?.name}
                  error={errors.name}
                  className="sm:col-span-2"
                />
                <Text
                  name="email"
                  label="Email"
                  type="email"
                  autoComplete="email"
                  defaultValue={customer?.email}
                  readOnly={!!customer}
                  error={errors.email}
                />
                <Text
                  name="phone"
                  label="Phone"
                  type="tel"
                  autoComplete="tel"
                  defaultValue={customer?.phone}
                  error={errors.phone}
                />
              </div>
            </Panel>

            <Panel title="Delivery" disabled={!!clientSecret}>
              <RadioGroup
                value={method}
                onValueChange={(v) => setMethod(v as 'delivery' | 'pickup')}
                className="grid gap-3 md:grid-cols-2"
              >
                <MethodCard
                  value="delivery"
                  icon={<Truck />}
                  title="Free next-day delivery"
                  description={formatDeliveryDate(settings.deliveryDate)}
                />
                {settings.pickupEnabled && (
                  <MethodCard
                    value="pickup"
                    icon={<Store />}
                    title="Pick up in store"
                    description={settings.pickupNote}
                  />
                )}
              </RadioGroup>

              {method === 'delivery' ? (
                <div className="mt-6 grid gap-4 sm:grid-cols-6">
                  <Text
                    name="line1"
                    label="Street address"
                    autoComplete="address-line1"
                    defaultValue={customer?.line1}
                    error={errors.line1}
                    className="sm:col-span-4"
                  />
                  <Text
                    name="line2"
                    label="Apt / suite (optional)"
                    autoComplete="address-line2"
                    defaultValue={customer?.line2}
                    className="sm:col-span-2"
                  />
                  <Text
                    name="city"
                    label="City"
                    autoComplete="address-level2"
                    defaultValue={customer?.city}
                    error={errors.city}
                    list="df2md-cities"
                    className="sm:col-span-3"
                  />
                  <div className="space-y-1.5 sm:col-span-1">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" value="NV" readOnly className="bg-muted" />
                  </div>
                  <Text
                    name="postalCode"
                    label="ZIP code"
                    autoComplete="postal-code"
                    inputMode="numeric"
                    defaultValue={customer?.postalCode}
                    error={errors.postalCode}
                    className="sm:col-span-2"
                  />
                  <datalist id="df2md-cities">
                    <option value="Las Vegas" />
                    <option value="Henderson" />
                    <option value="Boulder City" />
                  </datalist>
                  {settings.allowTimeRequest && (
                    <div className="space-y-1.5 sm:col-span-3">
                      <Label htmlFor="time">Preferred delivery time</Label>
                      <Select value={time} onValueChange={setTime}>
                        <SelectTrigger id="time" className="w-full bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any time</SelectItem>
                          {slots.map((s) => (
                            <SelectItem key={s} value={s}>
                              Around {formatSlot(s)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-5 flex items-start gap-2 rounded-lg bg-background p-4 text-sm">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="whitespace-pre-line">{settings.storeAddress}</span>
                </p>
              )}
              <div className="mt-4 space-y-1.5">
                <Label htmlFor="notes">Notes for our driver (optional)</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={2}
                  placeholder="Gate code, leave at the side door, frozen items…"
                  defaultValue={customer?.notes}
                  className="bg-background"
                />
              </div>
            </Panel>

            <Panel title="Payment" id="payment">
              {clientSecret ? (
                <>
                  <PaymentStep clientSecret={clientSecret} />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-3 text-muted-foreground"
                    onClick={() => setClientSecret(null)}
                  >
                    <Pencil /> Edit details
                  </Button>
                </>
              ) : (
                <p className="flex items-start gap-3 text-sm">
                  <Lock className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>
                    Continue to payment and the secure card form appears right here. Payments are
                    processed by Stripe; returning customers can use their saved cards.
                    {hasAutoship &&
                      ' Your card is saved for Autoship deliveries; you can pause or cancel anytime.'}
                  </span>
                </p>
              )}
            </Panel>
          </div>

          <aside className="space-y-5">
            <h2 className="text-2xl lg:mt-[3.25rem]">Your order</h2>
            <div className="space-y-5 rounded-xl border bg-accent/40 p-5">
              <ul className="space-y-4">
                {items.map((i) => (
                  <li key={i.id} className="flex gap-3">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-md border bg-white">
                      {i.imageUrl && (
                        <Image
                          src={i.imageUrl}
                          alt=""
                          fill
                          sizes="56px"
                          className="object-contain p-0.5"
                        />
                      )}
                      <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-foreground text-[11px] font-bold text-background">
                        {i.quantity}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="line-clamp-2 font-semibold text-foreground">{i.title}</p>
                      <p className="text-muted-foreground">
                        {i.option}
                        {i.autoship && (
                          <span className="ml-1 font-semibold text-sky">· Autoship</span>
                        )}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">{formatPrice(i.price * i.quantity)}</p>
                  </li>
                ))}
              </ul>
              {hasAutoship && (
                <p className="flex items-center gap-2 rounded-lg bg-sky/10 px-3 py-2 text-sm font-semibold text-sky">
                  <Repeat className="size-4" /> Autoship: {describeSchedule(schedule).toLowerCase()}
                  <Link href="/cart" className="ml-auto text-xs font-normal underline">
                    Change
                  </Link>
                </p>
              )}
              <Separator />
              <div className="space-y-2.5 text-sm">
                <Row label="Subtotal" value={formatPrice(fromCents(totals.subtotal))} />
                {totals.discount > 0 && (
                  <Row
                    label={`First Autoship (${settings.discountPercent}% off)`}
                    value={`−${formatPrice(fromCents(totals.discount))}`}
                    className="text-primary"
                  />
                )}
                <Row label={method === 'pickup' ? 'Pickup' : 'Delivery'} value="Free" />
                <Row
                  label={`Tax (${settings.taxRatePercent}%)`}
                  value={formatPrice(fromCents(totals.tax))}
                />
                <Separator />
                <Row
                  label={verified ? 'Total (verified)' : 'Total'}
                  value={formatPrice(fromCents(totals.total))}
                  className="text-base font-bold text-foreground"
                />
              </div>

              {problems.length > 0 && (
                <Notice>
                  <p className="font-semibold">Some items changed</p>
                  <ul className="list-disc pl-4">
                    {problems.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                  <Link href="/cart" className="underline">
                    Review your cart
                  </Link>
                </Notice>
              )}
              {message && <Notice>{message}</Notice>}

              {clientSecret ? (
                <p className="rounded-lg bg-accent px-3 py-2 text-center text-sm font-semibold text-accent-foreground">
                  Order verified. Complete your payment below.
                </p>
              ) : (
                <Button type="submit" size="lg" className="w-full text-base" disabled={submitting}>
                  {submitting ? 'Checking your order…' : 'Continue to payment'}
                </Button>
              )}
              <p className="text-center text-xs text-muted-foreground">
                By placing your order you agree to our{' '}
                <Link href="/terms-conditions" className="underline">
                  terms
                </Link>
                .
              </p>
            </div>
          </aside>
        </div>
      </form>
    </section>
  )
}

function Panel({
  title,
  children,
  disabled,
  id
}: {
  title: string
  children: React.ReactNode
  disabled?: boolean
  id?: string
}) {
  return (
    <fieldset
      id={id}
      disabled={disabled}
      className="scroll-mt-6 rounded-xl border bg-accent/40 p-4 transition-opacity disabled:opacity-60 sm:p-6"
    >
      <legend className="sr-only">{title}</legend>
      <h2 className="mb-5 text-xl">{title}</h2>
      {children}
    </fieldset>
  )
}

function Text({
  name,
  label,
  error,
  className,
  ...props
}: {
  name: string
  label: string
  error?: string
  className?: string
} & React.ComponentProps<'input'>) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        className="bg-background"
        {...props}
      />
      {error && (
        <p id={`${name}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

function MethodCard({
  value,
  icon,
  title,
  description
}: {
  value: string
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <label
      htmlFor={`method-${value}`}
      className="flex cursor-pointer items-start gap-3 rounded-lg border bg-background p-4 has-data-[state=checked]:border-primary has-data-[state=checked]:ring-1 has-data-[state=checked]:ring-primary"
    >
      <span className="text-primary [&_svg]:size-5">{icon}</span>
      <span className="flex-1">
        <span className="block font-semibold text-foreground">{title}</span>
        <span className="text-sm text-muted-foreground">{description}</span>
      </span>
      <RadioGroupItem id={`method-${value}`} value={value} />
    </label>
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

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="flex gap-2 rounded-lg border border-orange/40 bg-orange/10 p-3 text-sm text-foreground"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-orange" />
      <div className="space-y-1">{children}</div>
    </div>
  )
}
