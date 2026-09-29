'use server'

import { refresh } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type Stripe from 'stripe'
import { z } from 'zod'
import { clampSchedule, describeSchedule } from '@/lib/pricing'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import type { FormState } from './auth-actions'
import { getProfile, getUser } from './session'
import { getStripeCustomerId } from './stripe-customer'

const str = (form: FormData, key: string) => String(form.get(key) ?? '').trim()
const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null)
const fieldErrors = (error: z.ZodError) =>
  Object.fromEntries(error.issues.map((i) => [String(i.path[0]), i.message]))

const SIGNED_OUT: FormState = { error: 'Your session has expired. Please sign in again.' }

// ---------------------------------------------------------------- profile

const profileSchema = z.object({
  first_name: z.string().trim().min(1, 'Enter your first name').max(80),
  last_name: z.string().trim().min(1, 'Enter your last name').max(80),
  phone: optional(30),
  address_line1: optional(200),
  address_line2: optional(200),
  city: optional(100),
  state: z.string().trim().length(2).default('NV'),
  postal_code: z
    .string()
    .trim()
    .regex(/^(\d{5}(-\d{4})?)?$/, 'Enter a 5-digit ZIP code')
    .transform((v) => v || null),
  delivery_notes: optional(500)
})

export async function updateProfile(_: FormState, form: FormData): Promise<FormState> {
  const user = await getUser()
  if (!user) return SIGNED_OUT
  const parsed = profileSchema.safeParse(
    Object.fromEntries(Object.keys(profileSchema.shape).map((k) => [k, str(form, k)]))
  )
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) }

  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update(parsed.data).eq('id', user.id)
  if (error) return { error: 'We could not save your details. Please try again.' }

  // Keep the Stripe customer's name and phone in step (receipts, card-holder name)
  const profile = await getProfile()
  if (stripe && profile?.stripe_customer_id)
    await stripe.customers
      .update(profile.stripe_customer_id, {
        name: `${parsed.data.first_name} ${parsed.data.last_name}`,
        phone: parsed.data.phone ?? undefined
      })
      .catch(() => {})
  refresh()
  return { done: true }
}

// ---------------------------------------------------------------- dogs

const petSchema = z.object({
  name: z.string().trim().min(1, 'Enter your dog’s name').max(80),
  breed: optional(80),
  birth_date: z
    .string()
    .trim()
    .regex(/^(\d{4}-\d{2}-\d{2})?$/, 'Pick a date')
    .transform((v) => v || null)
})

export async function addPet(_: FormState, form: FormData): Promise<FormState> {
  const user = await getUser()
  if (!user) return SIGNED_OUT
  const parsed = petSchema.safeParse({
    name: str(form, 'name'),
    breed: str(form, 'breed'),
    birth_date: str(form, 'birth_date')
  })
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) }
  const supabase = await createClient()
  const { error } = await supabase.from('pets').insert({ ...parsed.data, user_id: user.id })
  if (error) return { error: 'We could not add your dog. Please try again.' }
  refresh()
  return { done: true }
}

export async function removePet(form: FormData) {
  const user = await getUser()
  if (!user) return
  const supabase = await createClient()
  // row-level security limits this to the customer's own dogs
  await supabase.from('pets').delete().eq('id', str(form, 'id')).eq('user_id', user.id)
  refresh()
}

// ---------------------------------------------------------------- payment methods

/** Opens Stripe's customer portal (saved cards, invoices) and comes back to the account. */
export async function openBillingPortal() {
  const user = await getUser()
  if (!user) redirect('/login?next=/account')
  const customerId = await getStripeCustomerId(user, await getProfile(), { create: true })
  if (!stripe || !customerId) redirect('/account?error=payments')
  const h = await headers()
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('x-forwarded-host') ?? h.get('host')}`
  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin.replace(/\/$/, '')}/account`
  })
  redirect(portal.url)
}

// ---------------------------------------------------------------- Autoship

/** Loads a subscription only if it belongs to the signed-in customer. */
async function ownSubscription(id: string) {
  const user = await getUser()
  if (!user || !stripe) return null
  const customerId = await getStripeCustomerId(user, await getProfile())
  if (!customerId || !id.startsWith('sub_')) return null
  const sub = await stripe.subscriptions.retrieve(id).catch(() => null)
  if (!sub || sub.status === 'canceled') return null
  const owner = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
  return owner === customerId ? { sub, stripe } : null
}

const NOT_FOUND: FormState = { error: 'We couldn’t find that Autoship. Please refresh the page.' }
const FAILED: FormState = { error: 'Something went wrong. Please try again or give us a call.' }

export async function pauseAutoship(_: FormState, form: FormData): Promise<FormState> {
  const found = await ownSubscription(str(form, 'id'))
  if (!found) return NOT_FOUND
  try {
    await found.stripe.subscriptions.update(found.sub.id, {
      pause_collection: { behavior: 'void' }
    })
  } catch {
    return FAILED
  }
  refresh()
  return { done: true }
}

export async function resumeAutoship(_: FormState, form: FormData): Promise<FormState> {
  const found = await ownSubscription(str(form, 'id'))
  if (!found) return NOT_FOUND
  try {
    await found.stripe.subscriptions.update(found.sub.id, { pause_collection: '' })
  } catch {
    return FAILED
  }
  refresh()
  return { done: true }
}

export async function cancelAutoship(_: FormState, form: FormData): Promise<FormState> {
  const found = await ownSubscription(str(form, 'id'))
  if (!found) return NOT_FOUND
  try {
    await found.stripe.subscriptions.cancel(found.sub.id)
  } catch {
    return FAILED
  }
  refresh()
  return { done: true }
}

const editSchema = z.object({
  count: z.coerce.number().int().min(1, 'At least 1').max(365),
  interval: z.enum(['day', 'week', 'month']),
  nextDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date')
})

const MAX_DAYS_AHEAD = 365

/**
 * Changes how often an Autoship comes, its quantities and the next order date. The next date is
 * set as the subscription's trial end, so changing the frequency never charges right away (Stripe
 * would otherwise start a new billing period immediately); the new schedule starts from there.
 */
export async function updateAutoship(_: FormState, form: FormData): Promise<FormState> {
  const found = await ownSubscription(str(form, 'id'))
  if (!found) return NOT_FOUND
  const parsed = editSchema.safeParse({
    count: form.get('count'),
    interval: form.get('interval'),
    nextDate: form.get('nextDate')
  })
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) }

  const { sub, stripe: s } = found
  const schedule = clampSchedule({ interval: parsed.data.interval, count: parsed.data.count })
  // Orders go out around 9am Las Vegas time (16:00 UTC) on the chosen day
  const next = Math.floor(Date.parse(`${parsed.data.nextDate}T16:00:00Z`) / 1000)
  const now = Math.floor(Date.now() / 1000)
  if (next <= now + 3600) return { fieldErrors: { nextDate: 'Pick a date after today' } }
  if (next > now + MAX_DAYS_AHEAD * 86400)
    return { fieldErrors: { nextDate: 'Pick a date within the next year' } }

  const items: Stripe.SubscriptionUpdateParams.Item[] = []
  for (const item of sub.items.data) {
    const raw = form.get(`qty_${item.id}`)
    const quantity = raw === null ? (item.quantity ?? 1) : Number(raw)
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > 99)
      return { fieldErrors: { [`qty_${item.id}`]: 'Enter 0–99' } }
    if (quantity === 0) {
      items.push({ id: item.id, deleted: true })
      continue
    }
    const product =
      typeof item.price.product === 'string' ? item.price.product : item.price.product.id
    items.push({
      id: item.id,
      quantity,
      price_data: {
        currency: item.price.currency,
        product,
        unit_amount: item.price.unit_amount ?? 0,
        recurring: { interval: schedule.interval, interval_count: schedule.count }
      },
      tax_rates: item.tax_rates?.map((t) => t.id) ?? []
    })
  }
  if (!items.some((i) => !i.deleted))
    return { error: 'To stop every item, cancel the Autoship instead.' }

  try {
    await s.subscriptions.update(sub.id, {
      items,
      trial_end: next,
      proration_behavior: 'none',
      metadata: { autoship_schedule: describeSchedule(schedule) }
    })
  } catch (error) {
    console.error('autoship update failed', error)
    return FAILED
  }
  refresh()
  return { done: true }
}
