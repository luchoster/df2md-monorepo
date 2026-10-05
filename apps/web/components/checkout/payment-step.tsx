'use client'

import {
  CheckoutElementsProvider,
  PaymentElement,
  useCheckoutElements
} from '@stripe/react-stripe-js/checkout'
import { loadStripe } from '@stripe/stripe-js'
import { AlertTriangle, Loader2, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
// loaded once per page, only when a key exists
const stripePromise = publishableKey ? loadStripe(publishableKey) : null

/**
 * Stripe's Payment Element (hosted fields) rendered inside our checkout, backed by a Checkout
 * Session in `elements` UI mode. Card data never touches our servers; we only hold the session's
 * client secret. Confirmation stays on the page unless the bank requires a redirect.
 */
export function PaymentStep({ clientSecret }: { clientSecret: string }) {
  const options = useMemo(
    () => ({
      clientSecret,
      elementsOptions: {
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

  async function pay() {
    setPaying(true)
    setError(null)
    const res = await checkout.confirm({ redirect: 'if_required' })
    if (res.type === 'error') {
      setError(res.error.message)
      setPaying(false)
      return
    }
    router.push(`/checkout/success?session_id=${encodeURIComponent(sessionId)}`)
  }

  return (
    <div className="space-y-5">
      <PaymentElement options={{ layout: 'tabs' }} />
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
