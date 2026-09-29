import { type NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { recordCheckoutOrder, recordRenewalOrder } from '@/lib/orders/record'
import { FIRST_AUTOSHIP_FLAG, stripe } from '@/lib/stripe'

/**
 * Stripe webhook. Subscribe to: checkout.session.completed,
 * checkout.session.async_payment_succeeded and invoice.paid.
 * - Saves each paid order (and every Autoship renewal) to Supabase for the account pages
 * - Marks the customer's first-Autoship discount as used
 * Handlers are idempotent, so Stripe's retries are safe. A 500 makes Stripe retry.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripe || !secret) return new NextResponse('Stripe is not configured', { status: 503 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      await req.text(),
      req.headers.get('stripe-signature') ?? '',
      secret
    )
  } catch {
    return new NextResponse('Invalid signature', { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object
        const customerId =
          typeof session.customer === 'string' ? session.customer : session.customer?.id
        if (
          customerId &&
          session.payment_status !== 'unpaid' &&
          session.metadata?.first_autoship_discount === 'true'
        ) {
          await stripe.customers.update(customerId, {
            metadata: { [FIRST_AUTOSHIP_FLAG]: 'true' }
          })
        }
        await recordCheckoutOrder(stripe, session.id)
        break
      }
      case 'invoice.paid':
        await recordRenewalOrder(stripe, event.data.object)
        break
    }
  } catch (error) {
    console.error(`stripe webhook ${event.type} failed`, error)
    return new NextResponse('Handler failed', { status: 500 })
  }
  return NextResponse.json({ received: true })
}
