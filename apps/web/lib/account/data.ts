import 'server-only'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import type { OrderWithItems, Pet } from '@/lib/supabase/types'
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
    expand: ['data.default_payment_method']
  })
  const live = subs.data.filter((s) =>
    ['active', 'trialing', 'past_due', 'unpaid'].includes(s.status)
  )
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
    return {
      id: s.id,
      status: s.pause_collection
        ? 'paused'
        : s.status === 'past_due' || s.status === 'unpaid'
          ? 'past_due'
          : 'active',
      interval: (recurring?.interval as Autoship['interval']) ?? 'month',
      count: recurring?.interval_count ?? 1,
      nextOrderAt: Number.isFinite(nextOrderAt) ? nextOrderAt : null,
      createdAt: s.created,
      fulfillment: s.metadata?.fulfillment === 'pickup' ? 'pickup' : 'delivery',
      address: s.metadata?.address || null,
      cardLabel: pm?.card ? `${pm.card.brand.toUpperCase()} •••• ${pm.card.last4}` : null,
      lines: s.items.data.map((item) => {
        const productId =
          typeof item.price.product === 'string' ? item.price.product : item.price.product.id
        const product = products.get(productId)
        const { title, option } = splitName(product?.name ?? 'Item')
        return {
          itemId: item.id,
          title,
          option,
          productId: product?.metadata?.productId ?? null,
          unitAmount: item.price.unit_amount ?? 0,
          quantity: item.quantity ?? 1
        }
      })
    }
  })
  return { autoships, available: true }
}
