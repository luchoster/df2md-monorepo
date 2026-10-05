import { CheckCircle2 } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ClearCart } from '@/components/checkout/clear-cart'
import { Button } from '@/components/ui/button'
import { getUser } from '@/lib/account/session'
import { formatDeliveryDate } from '@/lib/delivery'
import { formatPrice } from '@/lib/format'
import { stripe } from '@/lib/stripe'
import { accountsEnabled } from '@/lib/supabase/env'

export const metadata: Metadata = { title: 'Thank you', robots: { index: false } }

export default async function CheckoutSuccessPage({
  searchParams
}: PageProps<'/checkout/success'>) {
  const { session_id } = (await searchParams) as { session_id?: string }
  const session =
    stripe && session_id?.startsWith('cs_')
      ? await stripe.checkout.sessions
          .retrieve(session_id, { expand: ['line_items'] })
          .catch(() => null)
      : null
  const paid = session?.status === 'complete'
  const pickup = session?.metadata?.fulfillment === 'pickup'
  const user = await getUser()

  return (
    <section className="container max-w-2xl py-16 text-center md:py-24">
      {paid && <ClearCart />}
      <CheckCircle2 className="mx-auto mb-6 size-14 text-primary" />
      <h1 className="mb-3 text-3xl md:text-4xl">
        {paid ? 'Thank you for your order!' : 'Thank you!'}
      </h1>
      {paid ? (
        <>
          <p className="mb-8 text-muted-foreground">
            A confirmation is on its way to {session?.customer_details?.email ?? 'your email'}.{' '}
            {pickup
              ? 'Your order will be ready for pick up in about an hour.'
              : session?.metadata?.delivery_date
                ? `We'll deliver it ${formatDeliveryDate(session.metadata.delivery_date)}.`
                : ''}
            {session?.metadata?.autoship_schedule &&
              ` Autoship: ${session.metadata.autoship_schedule.toLowerCase()}.`}
          </p>
          <div className="mb-8 rounded-xl border p-5 text-left">
            <ul className="space-y-2 text-sm">
              {session?.line_items?.data.map((li) => (
                <li key={li.id} className="flex justify-between gap-4">
                  <span>
                    {li.quantity} × {li.description}
                  </span>
                  <span className="font-semibold">{formatPrice((li.amount_total ?? 0) / 100)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 flex justify-between border-t pt-3 font-bold">
              <span>Total paid</span>
              <span>{formatPrice((session?.amount_total ?? 0) / 100)}</span>
            </p>
          </div>
        </>
      ) : (
        <p className="mb-8 text-muted-foreground">
          If you just placed an order, you'll get a confirmation email shortly. Questions? Call us
          at (702) 971-2484.
        </p>
      )}
      {paid && accountsEnabled && !user && (
        <div className="mb-8 rounded-xl bg-footer p-5 text-sm">
          <p className="font-semibold">Track this order and manage your Autoship</p>
          <p className="mt-1 text-muted-foreground">
            Create an account with {session?.customer_details?.email ?? 'the same email'} and this
            order shows up automatically.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-3">
            <Link href="/register?next=/account/orders">Create an account</Link>
          </Button>
        </div>
      )}
      <div className="flex flex-wrap justify-center gap-3">
        {paid && user && (
          <Button asChild size="lg" variant="outline">
            <Link href="/account/orders">View my orders</Link>
          </Button>
        )}
        <Button asChild size="lg">
          <Link href="/shop">Continue shopping</Link>
        </Button>
      </div>
    </section>
  )
}
