import 'server-only'
import type Stripe from 'stripe'
import { saveStripeCustomerId } from '@/lib/account/stripe-customer'
import { nextDeliveryDate } from '@/lib/delivery'
import { createAdminClient } from '@/lib/supabase/server'
import { getSettings } from '@/sanity/lib/fetchers'

type Line = {
  title: string
  option: string | null
  productId: string | null
  variantKey: string | null
  unitAmount: number
  quantity: number
  autoship: boolean
}

/** Product names are saved as "Title – Size" at checkout. */
function splitName(name: string) {
  const at = name.lastIndexOf(' – ')
  return at > 0
    ? { title: name.slice(0, at), option: name.slice(at + 3) }
    : { title: name, option: null }
}

const idOf = (value: string | { id: string } | null | undefined) =>
  typeof value === 'string' ? value : (value?.id ?? null)

async function insertOrder(
  order: Record<string, unknown>,
  lines: Line[],
  conflictKey: 'stripe_checkout_session_id' | 'stripe_invoice_id'
) {
  const admin = createAdminClient()
  if (!admin) return { skipped: 'supabase_not_configured' as const }

  const { data, error } = await admin
    .from('orders')
    .upsert(order, { onConflict: conflictKey, ignoreDuplicates: true })
    .select('id')
  if (error) throw error
  const orderId = data?.[0]?.id as string | undefined
  if (!orderId) return { skipped: 'duplicate' as const } // webhook retry: already recorded

  const { error: itemsError } = await admin.from('order_items').insert(
    lines.map((l) => ({
      order_id: orderId,
      product_id: l.productId,
      variant_key: l.variantKey,
      title: l.title,
      option: l.option,
      unit_amount: l.unitAmount,
      quantity: l.quantity,
      autoship: l.autoship
    }))
  )
  if (itemsError) throw itemsError
  return { orderId }
}

/** checkout.session.completed / async_payment_succeeded → one order row with its items. */
export async function recordCheckoutOrder(stripe: Stripe, sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items.data.price.product']
  })
  if (session.payment_status === 'unpaid') return { skipped: 'unpaid' as const }

  const m = session.metadata ?? {}
  const lines: Line[] = (session.line_items?.data ?? []).map((li) => {
    const product = li.price?.product as Stripe.Product | undefined
    const { title, option } = splitName(product?.name ?? li.description ?? 'Item')
    const quantity = li.quantity ?? 1
    return {
      title,
      option,
      productId: product?.metadata?.productId ?? null,
      variantKey: product?.metadata?.variantKey ?? null,
      unitAmount: li.price?.unit_amount ?? Math.round(li.amount_subtotal / quantity),
      quantity,
      autoship: Boolean(li.price?.recurring)
    }
  })

  const customerId = idOf(session.customer)
  if (m.user_id && customerId) await saveStripeCustomerId(m.user_id, customerId)

  return insertOrder(
    {
      user_id: m.user_id || null,
      email: session.customer_details?.email ?? session.customer_email ?? '',
      customer_name: session.customer_details?.name ?? null,
      phone: m.phone || session.customer_details?.phone || null,
      kind: 'order',
      fulfillment: m.fulfillment === 'pickup' ? 'pickup' : 'delivery',
      delivery_date: m.delivery_date || null,
      requested_time: m.requested_time || null,
      address: m.address || null,
      notes: m.notes || null,
      autoship_schedule: m.autoship_schedule || null,
      subtotal: session.amount_subtotal ?? 0,
      discount: session.total_details?.amount_discount ?? 0,
      tax: session.total_details?.amount_tax ?? 0,
      total: session.amount_total ?? 0,
      currency: session.currency ?? 'usd',
      stripe_checkout_session_id: session.id,
      stripe_customer_id: customerId,
      stripe_subscription_id: idOf(session.subscription)
    },
    lines,
    'stripe_checkout_session_id'
  )
}

/**
 * invoice.paid for an Autoship renewal (not the first invoice, which the checkout order covers).
 * Delivery details come from the subscription's metadata; the date from today's delivery rules.
 */
export async function recordRenewalOrder(stripe: Stripe, invoice: Stripe.Invoice) {
  if (invoice.billing_reason !== 'subscription_cycle') return { skipped: 'not_renewal' as const }
  const details = invoice.parent?.subscription_details
  const m = details?.metadata ?? {}

  const productIds = [
    ...new Set(
      invoice.lines.data
        .map((l) => l.pricing?.price_details?.product)
        .filter((id): id is string => Boolean(id))
    )
  ]
  const products = productIds.length
    ? (await stripe.products.list({ ids: productIds, limit: 100 })).data
    : []
  const byId = new Map(products.map((p) => [p.id, p]))

  const lines: Line[] = invoice.lines.data
    .filter((l) => l.amount >= 0)
    .map((l) => {
      const product = byId.get(l.pricing?.price_details?.product ?? '')
      const { title, option } = splitName(product?.name ?? l.description ?? 'Item')
      const quantity = l.quantity ?? 1
      return {
        title,
        option,
        productId: product?.metadata?.productId ?? null,
        variantKey: product?.metadata?.variantKey ?? null,
        unitAmount: Math.round(l.amount / quantity),
        quantity,
        autoship: true
      }
    })

  const settings = await getSettings()
  const discount = (invoice.total_discount_amounts ?? []).reduce((sum, d) => sum + d.amount, 0)
  const tax = (invoice.total_taxes ?? []).reduce((sum, t) => sum + t.amount, 0)

  return insertOrder(
    {
      user_id: m.user_id || null,
      email: invoice.customer_email ?? '',
      customer_name: invoice.customer_name ?? null,
      phone: m.phone || invoice.customer_phone || null,
      kind: 'autoship_renewal',
      fulfillment: m.fulfillment === 'pickup' ? 'pickup' : 'delivery',
      delivery_date: nextDeliveryDate(settings?.delivery),
      requested_time: m.requested_time || null,
      address: m.address || null,
      notes: m.notes || null,
      autoship_schedule: m.autoship_schedule || null,
      subtotal: invoice.subtotal,
      discount,
      tax,
      total: invoice.total,
      currency: invoice.currency,
      stripe_invoice_id: invoice.id,
      stripe_customer_id: idOf(invoice.customer),
      stripe_subscription_id: idOf(details?.subscription)
    },
    lines,
    'stripe_invoice_id'
  )
}
