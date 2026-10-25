'use client'

import {
  CheckoutElementsProvider,
  PaymentElement,
  useCheckoutElements
} from '@stripe/react-stripe-js/checkout'
import { loadStripe, type StripeCheckoutSavedPaymentMethod } from '@stripe/stripe-js'
import { AlertTriangle, CreditCard, Loader2, Lock, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
// loaded once per page, only when a key exists
const stripePromise = publishableKey ? loadStripe(publishableKey) : null

/** The value of the "pay with a new card" choice; saved cards use their payment method id. */
const NEW_CARD = 'new'

/**
 * Stripe's Payment Element (hosted fields) rendered inside our checkout, backed by a Checkout
 * Session in `elements` UI mode. Card data never touches our servers; we only hold the session's
 * client secret. Returning customers choose one of their saved cards or enter a new one.
 * Confirmation stays on the page unless the bank requires a redirect.
 */
export function PaymentStep({ clientSecret }: { clientSecret: string }) {
  const options = useMemo(
    () => ({
      clientSecret,
      elementsOptions: {
        // We list saved cards ourselves (below); the Payment Element only collects a new card
        savedPaymentMethod: { enableRedisplay: 'never' as const, enableSave: 'auto' as const },
        appearance: {
          theme: 'stripe' as const,
          variables: {
            colorPrimary: '#00ad4c',
            colorText: '#212121',
            colorDanger: '#d92d20',
            fontFamily: 'Trueno, ui-sans-serif, system-ui, sans-serif',
            borderRadius: '8px',
            spacingUnit: '4px'
          }
        },
        fonts:
          typeof window === 'undefined'
            ? []
            : [300, 400, 600].map((weight) => ({
                family: 'Trueno',
                src: `url(${window.location.origin}/fonts/trueno-${weight}.woff2)`,
                weight: String(weight)
              }))
      }
    }),
    [clientSecret]
  )
  if (!stripePromise) return null
  return (
    <CheckoutElementsProvider stripe={stripePromise} options={options}>
      <PayForm sessionId={clientSecret.split('_secret_')[0] ?? ''} />
    </CheckoutElementsProvider>
  )
}

function PayForm({ sessionId }: { sessionId: string }) {
  const result = useCheckoutElements()
  const router = useRouter()
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // null until the customer picks: the first saved card when there is one, otherwise a new card
  const [choice, setChoice] = useState<string | null>(null)

  if (result.type === 'loading')
    return (
      <div className="space-y-3">
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
        <Skeleton className="h-11 w-full" />
      </div>
    )
  if (result.type === 'error') return <PayError message={result.error.message} />

  const { checkout } = result
  const total = checkout.total.total
  const saved = checkout.savedPaymentMethods ?? []
  const selected = choice ?? saved[0]?.id ?? NEW_CARD
  const usingSaved = selected !== NEW_CARD

  async function pay() {
    setPaying(true)
    setError(null)
    const res = await checkout.confirm({
      redirect: 'if_required',
      ...(usingSaved ? { paymentMethod: selected } : {})
    })
    if (res.type === 'error') {
      setError(res.error.message)
      setPaying(false)
      return
    }
    router.push(`/checkout/success?session_id=${encodeURIComponent(sessionId)}`)
  }

  return (
    <div className="space-y-5">
      {saved.length > 0 && (
        <RadioGroup
          value={selected}
          onValueChange={(v) => {
            setChoice(v)
            setError(null)
          }}
          aria-label="Payment method"
          className="gap-2"
        >
          {saved.map((pm) => (
            <PaymentChoice key={pm.id} value={pm.id} selected={selected === pm.id}>
              <CreditCard className="size-5 shrink-0 text-muted-foreground" />
              <span className="flex-1">
                <span className="font-semibold">{brandName(pm.card.brand)}</span> ending in{' '}
                {pm.card.last4}
              </span>
              <span className="text-sm text-muted-foreground">{expiry(pm)}</span>
            </PaymentChoice>
          ))}
          <PaymentChoice value={NEW_CARD} selected={!usingSaved}>
            <Plus className="size-5 shrink-0 text-muted-foreground" />
            <span className="flex-1 font-semibold">Use a new card</span>
          </PaymentChoice>
        </RadioGroup>
      )}
      {/* Mounted only for a new card so the hosted fields never validate an empty form when a
          saved card is charged */}
      {!usingSaved && (
        <div className={cn(saved.length > 0 && 'rounded-lg border p-4')}>
          <PaymentElement options={{ layout: 'tabs' }} />
        </div>
      )}
      {error && <PayError message={error} />}
      <Button type="button" size="lg" className="w-full text-base" onClick={pay} disabled={paying}>
        {paying ? (
          <>
            <Loader2 className="animate-spin" /> Processing…
          </>
        ) : (
          <>
            <Lock /> Pay {total.amount}
          </>
        )}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Payments are processed securely by Stripe. We never see or store your card number.
      </p>
    </div>
  )
}

function PaymentChoice({
  value,
  selected,
  children
}: {
  value: string
  selected: boolean
  children: React.ReactNode
}) {
  const id = `pay-${value}`
  return (
    <Label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-base font-normal transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50',
        selected ? 'border-primary bg-primary/5' : 'hover:bg-accent/40'
      )}
    >
      <RadioGroupItem id={id} value={value} />
      {children}
    </Label>
  )
}

const BRANDS: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
  diners: 'Diners Club',
  jcb: 'JCB',
  unionpay: 'UnionPay'
}

function brandName(brand: string) {
  return BRANDS[brand.toLowerCase()] ?? brand.replace(/^\w/, (c) => c.toUpperCase())
}

/** "Exp. 04/27" */
function expiry(pm: StripeCheckoutSavedPaymentMethod) {
  return `Exp. ${String(pm.card.expMonth).padStart(2, '0')}/${String(pm.card.expYear).slice(-2)}`
}

function PayError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
      <p>{message}</p>
    </div>
  )
}
