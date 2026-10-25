import { type NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getProfile, getUser } from '@/lib/account/session'
import { getStripeCustomerId } from '@/lib/account/stripe-customer'
import { hadAutoshipBefore } from '@/lib/checkout/first-autoship'
import { quoteCart } from '@/lib/checkout/quote'
import { type CheckoutResponse, checkoutRequestSchema, type SavedCard } from '@/lib/checkout/schema'
import { formatDeliveryDate, formatSlot } from '@/lib/delivery'
import { clampSchedule, describeSchedule } from '@/lib/pricing'
import { siteOrigin } from '@/lib/site-url'
import { findCustomer, getTaxRateId, stripe } from '@/lib/stripe'

const reply = (body: CheckoutResponse, status = 200) => NextResponse.json(body, { status })

/** "Delivery Thursday, Oct 23, around 2:00 PM" for Stripe's receipt */
const receiptNote = (method: 'delivery' | 'pickup', date: string, time?: string) =>
  `${method === 'pickup' ? 'Store pickup' : 'Delivery'} ${formatDeliveryDate(date)}${time ? `, around ${formatSlot(time)}` : ''}`

/**
 * Validates the checkout form, re-prices the cart from Sanity and creates a Stripe Checkout
 * Session in `elements` UI mode: the Payment Element renders on our /checkout page (no redirect
 * to Stripe). Subscription mode when anything is on Autoship; one-time items ride on the first
 * invoice. Returns the session's client secret. Without STRIPE_SECRET_KEY or the publishable key
 * it returns the verified quote and "payments_not_configured".
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
    // Signed in: the account's own Stripe customer (created if needed), whatever email is typed.
    // Guest: a returning customer with the same email keeps their Autoship history.
    const user = await getUser()
    const accountCustomerId =
      stripe && user ? await getStripeCustomerId(user, await getProfile(), { create: true }) : null
    const customer = !stripe
      ? null
      : accountCustomerId
        ? await stripe.customers.retrieve(accountCustomerId).then((c) => (c.deleted ? null : c))
        : await findCustomer(stripe, input.customer.email)
    const firstAutoship =
      input.items.some((i) => i.autoship) &&
      !(await hadAutoshipBefore(stripe, {
        customer,
        emails: [input.customer.email, user?.email ?? ''],
        userId: user?.id
      }))
    const { quote, problems } = await quoteCart(input, { firstAutoship })
    if (problems.length)
      return reply(
        { ok: false, error: 'cart_changed', message: 'Some items in your cart changed.', problems },
        409
      )
    if (!stripe || !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
      return reply({ ok: false, error: 'payments_not_configured', quote }, 503)

    // Signed in: the cards on the account's Stripe profile, made redisplayable so Checkout offers
    // them (done before the session is created, which is when Stripe decides what to list)
    const savedCards = accountCustomerId && customer ? await listSavedCards(stripe, customer) : []

    const origin = siteOrigin(req.nextUrl.origin)
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
      first_autoship_discount: quote.discount > 0 ? 'true' : 'false',
      ...(user ? { user_id: user.id } : {})
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
      ui_mode: 'elements',
      mode: hasAutoship ? 'subscription' : 'payment',
      line_items: lineItems,
      ...(customer ? { customer: customer.id } : { customer_email: input.customer.email }),
      ...(hasAutoship || customer ? {} : { customer_creation: 'always' as const }),
      ...(coupon ? { discounts: [{ coupon: coupon.id }] } : {}),
      // Signed-in customers pick from their saved cards. Stripe only lists cards marked
      // `allow_redisplay: always` by default; cards saved through the customer portal or imported
      // from the old shop are `unspecified`, so we ask for all of them. Guests matched by email
      // are not signed in, so they only get the save checkbox (the page hides saved cards too).
      saved_payment_method_options: customer
        ? {
            payment_method_save: 'enabled',
            ...(accountCustomerId
              ? { allow_redisplay_filters: ['always', 'limited', 'unspecified'] }
              : {})
          }
        : undefined,
      metadata,
      ...(hasAutoship
        ? {
            subscription_data: {
              metadata,
              description: `Autoship ${metadata.autoship_schedule?.toLowerCase()}`
            }
          }
        : {
            payment_intent_data: {
              metadata,
              setup_future_usage: 'off_session',
              // Shown on Stripe's receipt
              description: receiptNote(f.method, quote.deliveryDate, metadata.requested_time)
            }
          }),
      // only used when a payment method needs a redirect (e.g. some bank authentications)
      return_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`
    })
    if (!session.client_secret) throw new Error('Stripe did not return a client secret')
    return reply({ ok: true, clientSecret: session.client_secret, quote, savedCards })
  } catch (error) {
    console.error('checkout failed', error)
    return reply(
      { ok: false, error: 'server', message: 'We could not start checkout. Please try again.' },
      500
    )
  }
}

/**
 * The signed-in customer's cards, default first, straight from their Stripe profile.
 *
 * Checkout only redisplays cards whose `allow_redisplay` is `always`. Cards added in the customer
 * portal or saved without the checkbox are `unspecified`/`limited`, which is why a card visible
 * under "Payment methods" never showed at checkout. The customer put these cards on their own
 * account, so they're marked `always` here (Stripe's recommended fix for existing cards); the
 * session then lists them and accepts them in `confirm`.
 */
async function listSavedCards(s: Stripe, customer: Stripe.Customer): Promise<SavedCard[]> {
  try {
    const { data } = await s.customers.listPaymentMethods(customer.id, { type: 'card', limit: 10 })
    const def = customer.invoice_settings?.default_payment_method
    const defaultId = typeof def === 'string' ? def : (def?.id ?? null)
    await Promise.all(
      data
        .filter((pm) => pm.allow_redisplay !== 'always' && pm.id.startsWith('pm_'))
        .map((pm) =>
          s.paymentMethods
            .update(pm.id, { allow_redisplay: 'always' })
            .catch((error) => console.error('allow_redisplay update failed', pm.id, error))
        )
    )
    return data
      .filter((pm) => pm.card)
      .map((pm) => ({
        id: pm.id,
        brand: pm.card?.brand ?? 'card',
        last4: pm.card?.last4 ?? '',
        expMonth: pm.card?.exp_month ?? 0,
        expYear: pm.card?.exp_year ?? 0,
        isDefault: pm.id === defaultId
      }))
      .sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
  } catch (error) {
    console.error('could not list saved cards', error)
    return []
  }
}
