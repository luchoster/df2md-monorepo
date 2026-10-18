import 'server-only'
import { cache } from 'react'
import type Stripe from 'stripe'
import { findCustomer, stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import type { SessionUser } from './session'

/**
 * Whether a customer id exists for the key the site runs on. Customers imported from the old
 * shop carry their LIVE Stripe id, which test keys can't see; those fall back to the email
 * lookup below without overwriting the saved id. Cached per request.
 */
const existsForKey = cache(async (id: string) => {
  if (!stripe) return false
  try {
    const customer = await stripe.customers.retrieve(id)
    return !('deleted' in customer && customer.deleted)
  } catch (error) {
    if ((error as { code?: string }).code === 'resource_missing') return false
    throw error
  }
})

/**
 * The Stripe customer that belongs to this account. Uses the id saved on the profile; otherwise
 * adopts the Stripe customer with the same (confirmed) email, e.g. from a guest checkout, and
 * saves it. With `create`, makes a new one. Returns null when Stripe or the secret key is missing.
 */
export async function getStripeCustomerId(
  user: SessionUser,
  profile: {
    stripe_customer_id: string | null
    first_name?: string | null
    last_name?: string | null
  } | null,
  { create = false }: { create?: boolean } = {}
): Promise<string | null> {
  if (!stripe) return null
  if (profile?.stripe_customer_id && (await existsForKey(profile.stripe_customer_id)))
    return profile.stripe_customer_id
  if (!user.emailConfirmed) return null

  let customer: Stripe.Customer | null = await findCustomer(stripe, user.email)
  if (!customer && create) {
    const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ')
    customer = await stripe.customers.create({
      email: user.email,
      name: name || undefined,
      metadata: { supabase_user_id: user.id }
    })
  }
  if (!customer) return null
  await saveStripeCustomerId(user.id, customer.id)
  return customer.id
}

export async function saveStripeCustomerId(userId: string, customerId: string) {
  const admin = createAdminClient()
  if (!admin) return
  await admin
    .from('profiles')
    .update({ stripe_customer_id: customerId })
    .eq('id', userId)
    .is('stripe_customer_id', null)
}
