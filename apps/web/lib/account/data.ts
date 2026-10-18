import 'server-only'
import type Stripe from 'stripe'
import { hasPauseCoupon, stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import type { LegacySubscription, OrderWithItems, Pet } from '@/lib/supabase/types'
import { getProfile, getUser } from './session'
import { getStripeCustomerId } from './stripe-customer'

export async function getOrders(): Promise<OrderWithItems[]> {
  if (!(await getUser())) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false })
    .limit(100)
  return (data as OrderWithItems[] | null) ?? []
}

export async function getOrder(number: number): Promise<OrderWithItems | null> {
  if (!(await getUser()) || !Number.isSafeInteger(number)) return null
  const supabase = await createClient()
  const { data } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('number', number)
    .maybeSingle()
  return (data as OrderWithItems | null) ?? null
}

/** Autoships brought over from the old shop (still billed there until cutover). */
export async function getLegacyAutoships(): Promise<LegacySubscription[]> {
  if (!(await getUser())) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('legacy_subscriptions')
    .select('*')
    .neq('status', 'cancelled')
    .order('started_at', { ascending: false })
  return (data as LegacySubscription[] | null) ?? []
}

export async function getPets(): Promise<Pet[]> {
  if (!(await getUser())) return []
  const supabase = await createClient()
  const { data } = await supabase.from('pets').select('*').order('created_at')
  return (data as Pet[] | null) ?? []
}

export type AutoshipLine = {
  itemId: string
  title: string
  option: string | null
  productId: string | null
  unitAmount: number
  quantity: number
}

export type Autoship = {
  id: string
  /** Set on Autoships created by the old shop */
  snipcartId: string | null
  status: 'active' | 'paused' | 'past_due'
  interval: 'day' | 'week' | 'month'
  count: number
  /** unix seconds of the next charge + order */
  nextOrderAt: number | null
  createdAt: number
  fulfillment: 'delivery' | 'pickup'
  address: string | null
  lines: AutoshipLine[]
  cardLabel: string | null
}

function splitName(name: string) {
  const at = name.lastIndexOf(' – ')
  return at > 0
    ? { title: name.slice(0, at), option: name.slice(at + 3) }
    : { title: name, option: null }
}

/** The customer's Autoship subscriptions straight from Stripe (the source of truth). */
export async function getAutoships(): Promise<{ autoships: Autoship[]; available: boolean }> {
  const user = await getUser()
  if (!user || !stripe) return { autoships: [], available: Boolean(stripe) }
  const customerId = await getStripeCustomerId(user, await getProfile())
  if (!customerId) return { autoships: [], available: true }

  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 50,
    expand: ['data.default_payment_method', 'data.discounts.source.coupon']
  })
  const live = subs.data.filter((s) =>
    ['active', 'trialing', 'past_due', 'unpaid'].includes(s.status)
  )

  // Autoships set up on the old shop: product, size and photo come from the imported record,
  // delivery from the profile, and the card from the customer's default (Snipcart never set one
  // on the subscription)
  const fromSnipcart = live.filter((s) => s.metadata?.snipcart_subscription_id)
  const legacy = new Map<string, LegacySubscription>()
  let fallbackCard: string | null = null
  let profileAddress: string | null = null
  if (fromSnipcart.length) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('legacy_subscriptions')
      .select('*')
      .in(
        'snipcart_id',
        fromSnipcart.map((s) => s.metadata.snipcart_subscription_id)
      )
    for (const row of (data as LegacySubscription[] | null) ?? []) legacy.set(row.snipcart_id, row)
    const profile = await getProfile()
    profileAddress =
      [
        profile?.address_line1,
        profile?.address_line2,
        profile?.city,
        [profile?.state, profile?.postal_code].filter(Boolean).join(' ')
      ]
        .filter(Boolean)
        .join(', ') || null
    if (fromSnipcart.some((s) => !s.default_payment_method)) {
      const customer = await stripe.customers.retrieve(customerId, {
        expand: ['invoice_settings.default_payment_method', 'default_source']
      })
      if (!('deleted' in customer && customer.deleted)) {
        const pm = customer.invoice_settings?.default_payment_method
        const source = customer.default_source
        const card =
          pm && typeof pm !== 'string'
            ? pm.card
            : source && typeof source !== 'string' && source.object === 'card'
              ? source
              : null
        if (card) fallbackCard = `${card.brand.toUpperCase()} •••• ${card.last4}`
      }
    }
  }
  const productIds = [
    ...new Set(
      live.flatMap((s) =>
        s.items.data.map((i) =>
          typeof i.price.product === 'string' ? i.price.product : i.price.product.id
        )
      )
    )
  ]
  const products = new Map<string, Stripe.Product>()
  for (let i = 0; i < productIds.length; i += 100) {
    const page = await stripe.products.list({ ids: productIds.slice(i, i + 100), limit: 100 })
    for (const p of page.data) products.set(p.id, p)
  }

  const autoships = live.map((s): Autoship => {
    const first = s.items.data[0]
    const recurring = first?.price.recurring
    const nextOrderAt =
      s.status === 'trialing' && s.trial_end
        ? s.trial_end
        : Math.min(...s.items.data.map((i) => i.current_period_end))
    const pm = s.default_payment_method as Stripe.PaymentMethod | null
    const old = legacy.get(s.metadata?.snipcart_subscription_id ?? '')
    return {
      id: s.id,
      snipcartId: s.metadata?.snipcart_subscription_id ?? null,
      status:
        s.pause_collection || hasPauseCoupon(s)
          ? 'paused'
          : s.status === 'past_due' || s.status === 'unpaid'
            ? 'past_due'
            : 'active',
      interval: (recurring?.interval as Autoship['interval']) ?? 'month',
      count: recurring?.interval_count ?? 1,
      nextOrderAt: Number.isFinite(nextOrderAt) ? nextOrderAt : null,
      createdAt: s.created,
      fulfillment: s.metadata?.fulfillment === 'pickup' ? 'pickup' : 'delivery',
      address: s.metadata?.address || (old ? profileAddress : null),
      cardLabel: pm?.card
        ? `${pm.card.brand.toUpperCase()} •••• ${pm.card.last4}`
        : old
          ? fallbackCard
          : null,
      lines: s.items.data.map((item) => {
        const productId =
          typeof item.price.product === 'string' ? item.price.product : item.price.product.id
        const product = products.get(productId)
        const { title, option } = old
          ? { title: old.title, option: old.option }
          : splitName(product?.name ?? 'Item')
        return {
          itemId: item.id,
          title,
          option,
          productId: product?.metadata?.productId ?? old?.product_id ?? null,
          unitAmount: item.price.unit_amount ?? 0,
          quantity: item.quantity ?? 1
        }
      })
    }
  })
  return { autoships, available: true }
}
