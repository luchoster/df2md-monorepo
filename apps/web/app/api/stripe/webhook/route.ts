import { type NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { FIRST_AUTOSHIP_FLAG, stripe } from '@/lib/stripe'

/**
 * Stripe webhook (checkout.session.completed for now). Marks the customer's first-Autoship
 * discount as used. Order emails, Supabase order records and subscription sync come in P5.
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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const customerId =
      typeof session.customer === 'string' ? session.customer : session.customer?.id
    if (customerId && session.metadata?.first_autoship_discount === 'true') {
      await stripe.customers.update(customerId, { metadata: { [FIRST_AUTOSHIP_FLAG]: 'true' } })
    }
  }
  return NextResponse.json({ received: true })
}
