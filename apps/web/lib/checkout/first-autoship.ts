import 'server-only'
import type Stripe from 'stripe'
import { FIRST_AUTOSHIP_FLAG } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * The first-Autoship discount is for customers who never had an Autoship, on this site or the
 * old shop. Cancelling one and checking out again doesn't make the next one "first". Looks at:
 * - the redeemed flag the webhook sets on the Stripe customer
 * - any subscription, in any status (cancelled ones included), on every Stripe customer with
 *   one of these emails. The old shop's Autoships were Stripe subscriptions on the same account.
 * - the old shop's history in Supabase: Autoships and renewal orders by email or account
 * Errors count as "used": better to miss a discount than to give it twice.
 */
export async function hadAutoshipBefore(
  stripe: Stripe | null,
  {
    customer,
    emails,
    userId
  }: { customer: Stripe.Customer | null; emails: string[]; userId?: string | null }
) {
  if (customer?.metadata?.[FIRST_AUTOSHIP_FLAG] === 'true') return true
  const addresses = [...new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean))]
  try {
    const [inStripe, inHistory] = await Promise.all([
      stripe ? hasStripeSubscription(stripe, customer, addresses) : false,
      hasOldShopAutoship(addresses, userId)
    ])
    return inStripe || inHistory
  } catch (error) {
    console.error('first-Autoship check failed', error)
    return true
  }
}

async function hasStripeSubscription(
  stripe: Stripe,
  customer: Stripe.Customer | null,
  emails: string[]
) {
  const ids = new Set(customer ? [customer.id] : [])
  for (const email of emails) {
    const found = await stripe.customers.list({ email, limit: 20 })
    for (const c of found.data) ids.add(c.id)
  }
  for (const id of ids) {
    const subs = await stripe.subscriptions.list({ customer: id, status: 'all', limit: 1 })
    if (subs.data.length) return true
  }
  return false
}

async function hasOldShopAutoship(emails: string[], userId?: string | null) {
  const db = createAdminClient()
  if (!db || (!emails.length && !userId)) return false
  const who = [
    ...emails.map((e) => `email.eq.${JSON.stringify(e)}`),
    ...(userId ? [`user_id.eq.${userId}`] : [])
  ].join(',')
  const [subs, renewals] = await Promise.all([
    db.from('legacy_subscriptions').select('id').or(who).limit(1),
    db
      .from('orders')
      .select('id')
      .or(who)
      .or('kind.eq.autoship_renewal,stripe_subscription_id.not.is.null')
      .limit(1)
  ])
  if (subs.error) throw subs.error
  if (renewals.error) throw renewals.error
  return Boolean(subs.data.length || renewals.data.length)
}
