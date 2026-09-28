import { type NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { quoteCart } from '@/lib/checkout/quote'
import { type CheckoutResponse, checkoutRequestSchema } from '@/lib/checkout/schema'
import { clampSchedule, describeSchedule } from '@/lib/pricing'
import { FIRST_AUTOSHIP_FLAG, findCustomer, getTaxRateId, stripe } from '@/lib/stripe'

const reply = (body: CheckoutResponse, status = 200) => NextResponse.json(body, { status })

/**
 * Validates the checkout form, re-prices the cart from Sanity and creates a Stripe Checkout
 * Session (subscription mode when anything is on Autoship; one-time items ride on the first
 * invoice). Without STRIPE_SECRET_KEY it returns the verified quote and "payments_not_configured".
 */
export async function POST(req: NextRequest) {
  const parsed = checkoutRequestSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success)
    return reply(
      {
        ok: false,
        error: 'invalid',
        issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }))
      },
      400
    )
  const input = parsed.data
  const schedule = clampSchedule(input.schedule)

  try {
    const customer = stripe ? await findCustomer(stripe, input.customer.email) : null
    const firstAutoship = customer?.metadata?.[FIRST_AUTOSHIP_FLAG] !== 'true'
    const { quote, problems } = await quoteCart(input, { firstAutoship })
    if (problems.length)
      return reply(
        { ok: false, error: 'cart_changed', message: 'Some items in your cart changed.', problems },
        409
      )
    if (!stripe) return reply({ ok: false, error: 'payments_not_configured', quote }, 503)

    const origin = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin
    const hasAutoship = quote.lines.some((l) => l.autoship)
    const taxRate =
      quote.taxRatePercent > 0 ? await getTaxRateId(stripe, quote.taxRatePercent) : null
    const f = input.fulfillment
    const metadata: Record<string, string> = {
      fulfillment: f.method,
      delivery_date: quote.deliveryDate,
      phone: input.customer.phone,
      ...(f.method === 'delivery'
        ? {
            address: [
              f.address.line1,
              f.address.line2,
              `${f.address.city}, ${f.address.state} ${f.address.postalCode}`
            ]
              .filter(Boolean)
              .join(', '),
            requested_time: f.requestedTime ?? ''
          }
        : {}),
      notes: f.notes ?? '',
      ...(hasAutoship ? { autoship_schedule: describeSchedule(schedule) } : {}),
      first_autoship_discount: quote.discount > 0 ? 'true' : 'false'
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = quote.lines.map((l) => ({
      quantity: l.quantity,
      tax_rates: taxRate ? [taxRate] : undefined,
      price_data: {
        currency: 'usd',
        unit_amount: l.unitAmount,
        product_data: {
          name: `${l.title} – ${l.option}`,
          metadata: { productId: l.productId, variantKey: l.variantKey }
        },
        ...(l.autoship
          ? { recurring: { interval: schedule.interval, interval_count: schedule.count } }
          : {})
      }
    }))

    // First-Autoship discount = exactly the discountable Autoship amount, once, on the first invoice
    const coupon =
      quote.discount > 0
        ? await stripe.coupons.create({
            amount_off: quote.discount,
            currency: 'usd',
            duration: 'once',
            max_redemptions: 1,
            name: `First Autoship ${quote.discountPercent}% off`
          })
        : null

    const session = await stripe.checkout.sessions.create({
      mode: hasAutoship ? 'subscription' : 'payment',
      line_items: lineItems,
      ...(customer ? { customer: customer.id } : { customer_email: input.customer.email }),
      ...(hasAutoship || customer ? {} : { customer_creation: 'always' as const }),
      ...(coupon ? { discounts: [{ coupon: coupon.id }] } : {}),
      saved_payment_method_options: customer ? { payment_method_save: 'enabled' } : undefined,
      metadata,
      ...(hasAutoship
        ? { subscription_data: { metadata } }
        : { payment_intent_data: { metadata, setup_future_usage: 'off_session' } }),
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout`
    })
    if (!session.url) throw new Error('Stripe did not return a checkout URL')
    return reply({ ok: true, url: session.url })
  } catch (error) {
    console.error('checkout failed', error)
    return reply(
      { ok: false, error: 'server', message: 'We could not start checkout. Please try again.' },
      500
    )
  }
}
