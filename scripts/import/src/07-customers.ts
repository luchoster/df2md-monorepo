/**
 * Plan §4: customers, order history and Autoships from the old shop → Supabase.
 *
 *   bun run customers                          dry run: reads everything, prints what it would write
 *   bun run customers --apply                  writes to Supabase
 *   bun run customers --apply --link-stripe    also puts each customer's LIVE Stripe id on their
 *                                              profile (launch step; test keys fall back by email)
 *
 * Sources: the Snipcart export in ~/Sites/dogfood/backups/snipcart (customers, orders,
 * subscriptions) and the LIVE Stripe account through STRIPE_READ_KEY (read-only restricted key:
 * cards and subscription status). Dogs come from the WordPress users (out/customers.json).
 *
 * Sends nothing and charges nothing: Supabase users are created through the admin API with the
 * email already confirmed (no confirmation or invite email), and Stripe is only read.
 * Idempotent: users are matched by email, orders by Snipcart token, Autoships by Stripe id.
 * Profile fields are only filled where empty, so edits made on the new site survive a re-run.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { argFlag, OUT_DIR, ROOT } from './lib/env'
import { importClient } from './lib/sanity'

const apply = argFlag('apply')
const linkStripe = argFlag('link-stripe')
const SNIPCART_DIR =
  process.env.SNIPCART_EXPORT ?? join(ROOT, '..', '..', '..', 'backups', 'snipcart')

const env = (name: string) => {
  const value = process.env[name]
  if (!value) throw new Error(`Missing env var ${name}`)
  return value
}
const SUPABASE_URL = env('NEXT_PUBLIC_SUPABASE_URL')
const SUPABASE_KEY = env('SUPABASE_SECRET_KEY')
const STRIPE_KEY = env('STRIPE_READ_KEY')
if (!STRIPE_KEY.startsWith('rk_'))
  throw new Error('STRIPE_READ_KEY must be a restricted (read-only) key')

const read = (file: string) => JSON.parse(readFileSync(join(SNIPCART_DIR, file), 'utf8'))
const snipCustomers: any[] = read('customers.json')
const snipOrders: any[] = read('orders.json')
const snipSubs: any[] = read('subscriptions.json')
const wpCustomers: any[] = existsSync(join(OUT_DIR, 'customers.json'))
  ? JSON.parse(readFileSync(join(OUT_DIR, 'customers.json'), 'utf8'))
  : []

const lower = (s: unknown) =>
  String(s ?? '')
    .trim()
    .toLowerCase()
const cents = (n: unknown) => Math.round(Number(n ?? 0) * 100)
const blank = (s: unknown) => (typeof s === 'string' && s.trim() ? s.trim() : null)

async function pool<T>(items: T[], size: number, fn: (item: T) => Promise<void>) {
  const queue = [...items]
  await Promise.all(
    Array.from({ length: size }, async () => {
      for (let item = queue.shift(); item !== undefined; item = queue.shift()) await fn(item)
    })
  )
}

// ------------------------------------------------------------------ Stripe (read-only)
async function stripe(path: string): Promise<any> {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`https://api.stripe.com/v1/${path}`, {
      headers: { Authorization: `Bearer ${STRIPE_KEY}` }
    })
    if (res.ok || res.status === 404) return res.json()
    if (attempt >= 5) throw new Error(`Stripe ${path}: ${res.status} ${await res.text()}`)
    await Bun.sleep(500 * attempt)
  }
}
const card = (pm: any) =>
  pm?.card && {
    brand: pm.card.brand,
    last4: pm.card.last4,
    exp_month: pm.card.exp_month,
    exp_year: pm.card.exp_year
  }

// ------------------------------------------------------------------ Supabase (secret key)
const sbHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
}
async function sb(path: string, init: RequestInit & { prefer?: string } = {}): Promise<any> {
  const { prefer, ...rest } = init
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...rest,
    headers: { ...sbHeaders, ...(prefer ? { Prefer: prefer } : {}) }
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Supabase ${init.method ?? 'GET'} ${path}: ${res.status} ${text}`)
  return text ? JSON.parse(text) : null
}
async function selectAll(table: string, columns: string) {
  const rows: any[] = []
  for (let from = 0; ; from += 1000) {
    const page = await sb(
      `/rest/v1/${table}?select=${columns}&order=${columns.split(',')[0]}&offset=${from}&limit=1000`
    )
    rows.push(...page)
    if (page.length < 1000) return rows
  }
}
async function listUsers() {
  const users: any[] = []
  for (let page = 1; ; page++) {
    const res = await sb(`/auth/v1/admin/users?page=${page}&per_page=1000`)
    users.push(...res.users)
    if (res.users.length < 1000) return users
  }
}

// ------------------------------------------------------------------ Sanity products by WP id
type ProductRef = {
  id: string
  variants: { _key: string; option?: string; flavor?: string }[]
  flavor?: string
}
const sanity = importClient()
const sanityProducts: any[] = await sanity.fetch(
  `*[_type == "product" && defined(legacy.wpId) && !(_id in path("drafts.**"))]{
    _id, "wpId": string(legacy.wpId), "into": legacy.mergedInto._ref, "flavor": legacy.mergedFlavor,
    variants[]{_key, option, flavor}
  }`
)
const byId = new Map(sanityProducts.map((p) => [p._id, p]))
const productByWp = new Map<string, ProductRef>()
for (const p of sanityProducts) {
  const kept = p.into ? byId.get(p.into) : p
  if (kept)
    productByWp.set(p.wpId, { id: kept._id, variants: kept.variants ?? [], flavor: p.flavor })
}
const norm = (s: unknown) =>
  lower(s)
    .replace(/[\s.]+/g, '')
    .replace(/s$/, '')
function matchProduct(wpId: string, size: string | null) {
  const p = productByWp.get(wpId)
  if (!p) return { product_id: null, variant_key: null }
  const v =
    p.variants.find((v) => norm(v.option) === norm(size) && (!p.flavor || v.flavor === p.flavor)) ??
    (p.variants.length === 1 ? p.variants[0] : undefined)
  return { product_id: p.id, variant_key: v?._key ?? null }
}

// ------------------------------------------------------------------ build rows
const PLURAL: Record<string, string> = { Day: 'day', Week: 'week', Month: 'month', Year: 'year' }
const every = (s: { interval: string; intervalCount: number } | null | undefined) => {
  if (!s) return null
  const unit = PLURAL[s.interval] ?? lower(s.interval)
  return s.intervalCount === 1 ? `Every ${unit}` : `Every ${s.intervalCount} ${unit}s`
}
const sizeOf = (item: any) =>
  blank(item.customFields?.find((f: any) => lower(f.name) === 'size')?.value)
const address = (o: any, prefix: 'shipping' | 'billing') =>
  [
    o[`${prefix}AddressAddress1`],
    o[`${prefix}AddressAddress2`],
    o[`${prefix}AddressCity`],
    [o[`${prefix}AddressProvince`], o[`${prefix}AddressPostalCode`]].filter(Boolean).join(' ')
  ]
    .map(blank)
    .filter(Boolean)
    .join(', ') || null

/** Old orders copy the first order's delivery date forward, so only trust one near the order date. */
function deliveryDate(o: any): string | null {
  const raw = String(o.metadata?.deliveryDate ?? '')
  const us = /^(\d{2})-(\d{2})-(\d{4})$/.exec(raw)
  const iso = us ? `${us[3]}-${us[1]}-${us[2]}` : /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null
  if (!iso) return null
  const days = (Date.parse(iso) - Date.parse(o.creationDate)) / 86400000
  return days >= -1 && days <= 45 ? iso : null
}

const subStripeId = new Map(snipSubs.map((s) => [s.id, s.gatewayId as string]))
const today = new Date().toISOString().slice(0, 10)
const orders = [...snipOrders]
  .sort((a, b) => a.creationDate.localeCompare(b.creationDate))
  .map((o) => {
    const subtotal = cents(o.itemsTotal ?? o.subtotal)
    const tax = cents(o.taxesTotal)
    const shipping = cents(o.shippingFees)
    const total = cents(o.finalGrandTotal ?? o.grandTotal)
    const refunded = cents(o.refundsAmount)
    const delivery = deliveryDate(o)
    const status =
      o.paymentStatus === 'ChargedBack' || (refunded > 0 && refunded >= total)
        ? 'refunded'
        : lower(o.status) === 'cancelled'
          ? 'cancelled'
          : delivery && delivery >= today
            ? 'paid'
            : 'delivered'
    const autoshipItem = o.items.find((i: any) => i.paymentSchedule || i.subscription)
    return {
      order: {
        source: 'snipcart',
        legacy_id: o.token,
        legacy_number: o.invoiceNumber,
        email: lower(o.email),
        customer_name: blank(o.shippingAddressName) ?? blank(o.billingAddressName),
        phone: blank(o.shippingAddressPhone) ?? blank(o.billingAddressPhone),
        status,
        kind: o.isRecurringOrder ? 'autoship_renewal' : 'order',
        fulfillment: 'delivery',
        delivery_date: delivery,
        address: address(o, 'shipping') ?? address(o, 'billing'),
        notes: blank(o.notes),
        autoship_schedule: every(autoshipItem?.paymentSchedule ?? autoshipItem?.subscription),
        subtotal,
        discount: Math.max(0, subtotal + shipping + tax - total),
        tax,
        total,
        refunded,
        currency: lower(o.currency) || 'usd',
        stripe_customer_id: o.user?.gatewayId ?? null,
        stripe_subscription_id: (o.subscriptionId && subStripeId.get(o.subscriptionId)) || null,
        created_at: o.creationDate
      },
      items: o.items.map((i: any) => {
        const size = sizeOf(i)
        return {
          ...(i.id === 'adjustment'
            ? { product_id: null, variant_key: null }
            : matchProduct(String(i.id), size)),
          title: blank(i.name) ?? 'Item',
          option: size,
          unit_amount: cents(i.price),
          quantity: Math.max(1, Number(i.quantity) || 1),
          autoship: Boolean(i.paymentSchedule || i.subscription)
        }
      })
    }
  })

// ------------------------------------------------------------------ names and addresses
// Snipcart's customer record is often empty (guest checkouts); every order has the details
const latestOrder = new Map<string, any>()
for (const o of snipOrders) {
  const e = lower(o.email)
  if (!latestOrder.has(e) || o.creationDate > latestOrder.get(e).creationDate) latestOrder.set(e, o)
}
const tidyCase = (word: string) =>
  word.replace(/[A-Za-z][^\s-']*/g, (w) => w[0]!.toUpperCase() + w.slice(1).toLowerCase())
/** "LUIS E SUAREZ" → { first: "Luis", last: "Suarez" }; middle initials are dropped. */
function splitFullName(full: string | null) {
  if (!full) return { first: null, last: null }
  const shouty = full === full.toUpperCase() || full === full.toLowerCase()
  const words = full
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (shouty ? tidyCase(w) : w))
  if (words.length === 1) return { first: words[0]!, last: null }
  const inner = words.slice(1, -1)
  const initials = inner.every((w) => /^[A-Za-z]\.?$/.test(w))
  return {
    first: words[0]!,
    last: initials ? words.at(-1)! : [...inner, words.at(-1)].join(' ')
  }
}
function contactFor(c: any) {
  const o = latestOrder.get(lower(c.email)) ?? {}
  const wp = wpByEmail.get(lower(c.email))
  const pick = (field: string) =>
    blank(c[`shipping${field}`]) ??
    blank(c[`billing${field}`]) ??
    blank(o[`shipping${field}`]) ??
    blank(o[`billing${field}`])
  const name = splitFullName(
    blank(c.billingAddressName) ??
      blank(c.shippingAddressName) ??
      blank(o.billingAddressName) ??
      blank(o.shippingAddressName) ??
      blank(o.cardHolderName)
  )
  // Address fields come as a set, from the same record
  const from = [c, o].find(
    (r) => blank(r.shippingAddressAddress1) || blank(r.billingAddressAddress1)
  )
  const side = from && blank(from.shippingAddressAddress1) ? 'shipping' : 'billing'
  const addr = (field: string) => (from ? blank(from[`${side}Address${field}`]) : null)
  return {
    first_name: blank(wp?.firstName) ?? name.first,
    last_name: blank(wp?.lastName) ?? name.last,
    phone: pick('AddressPhone') ?? blank(wp?.phone),
    address_line1: addr('Address1'),
    address_line2: addr('Address2'),
    city: addr('City'),
    state: addr('Province'),
    postal_code: addr('PostalCode')
  }
}

// ------------------------------------------------------------------ live Stripe reads
console.log('Reading live Stripe (cards, Autoships)…')
const cardsByCustomer = new Map<string, any[]>()
await pool(
  snipCustomers.filter((c) => c.gatewayId),
  8,
  async (c) => {
    const res = await stripe(`payment_methods?customer=${c.gatewayId}&type=card&limit=100`)
    cardsByCustomer.set(c.gatewayId, (res.data ?? []).map(card))
  }
)
const stripeSubs = new Map<string, any>()
await pool(snipSubs, 6, async (s) => {
  stripeSubs.set(
    s.gatewayId,
    await stripe(`subscriptions/${s.gatewayId}?expand[]=default_payment_method`)
  )
})

// ------------------------------------------------------------------ Supabase: users
const existingUsers = await listUsers()
const userByEmail = new Map(existingUsers.map((u) => [lower(u.email), u]))
const wpByEmail = new Map(wpCustomers.map((c) => [lower(c.email), c]))
const toCreate = snipCustomers.filter((c) => c.email && !userByEmail.has(lower(c.email)))
const orderEmails = new Set(orders.map((o) => o.order.email))
const customerEmails = new Set(snipCustomers.map((c) => lower(c.email)))
const orphanOrderEmails = [...orderEmails].filter((e) => !customerEmails.has(e))

const tally = (values: string[]) => {
  const counts = new Map<string, number>()
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1)
  return [...counts].map(([k, n]) => `${k} ${n}`).join(', ')
}
const subStatus = (s: any) => {
  const st = stripeSubs.get(s.gatewayId)
  if (!st || st.error || st.status === 'canceled' || s.cancelledOn) return 'cancelled'
  if (s.status === 'Paused') return 'paused'
  if (st.status === 'past_due' || st.status === 'unpaid') return 'past_due'
  return 'active'
}
console.log(`
Customers:  ${snipCustomers.length} in Snipcart, ${toCreate.length} to create, ${snipCustomers.length - toCreate.length} already have an account
            ${wpCustomers.filter((c) => c.pets?.length).length} with dogs from WordPress
Orders:     ${orders.length} (${orders.filter((o) => o.order.kind === 'autoship_renewal').length} Autoship renewals), ${orders.reduce((n, o) => n + o.items.length, 0)} items
            status: ${tally(orders.map((o) => o.order.status))}
            items linked to a product: ${orders.flatMap((o) => o.items).filter((i: any) => i.product_id).length}, to a variant: ${orders.flatMap((o) => o.items).filter((i: any) => i.variant_key).length}
            order emails without a Snipcart customer: ${orphanOrderEmails.length} (orders still show if they register)
Autoships:  ${snipSubs.length}: ${tally(snipSubs.map(subStatus))}
`)
if (!apply) {
  console.log('Dry run: nothing written. Run with --apply to import.')
  process.exit(0)
}

let created = 0
await pool(toCreate, 5, async (c) => {
  const { first_name: first, last_name: last } = contactFor(c)
  const user = await sb('/auth/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      email: lower(c.email),
      email_confirm: true, // no confirmation email
      user_metadata: { first_name: first, last_name: last },
      app_metadata: { source: 'snipcart-import', snipcart_customer_id: c.id }
    })
  })
  userByEmail.set(lower(c.email), user)
  if (++created % 200 === 0) console.log(`  users ${created}/${toCreate.length}`)
})
console.log(`users: ${created} created`)

// ------------------------------------------------------------------ profiles (fill empty fields)
const profiles = new Map(
  (
    await selectAll(
      'profiles',
      'id,first_name,last_name,phone,address_line1,address_line2,city,state,postal_code,stripe_customer_id'
    )
  ).map((p: any) => [p.id, p])
)
let patched = 0
await pool(snipCustomers, 8, async (c) => {
  const user = userByEmail.get(lower(c.email))
  const p = user && profiles.get(user.id)
  if (!p) return
  const { state, ...fill } = contactFor(c)
  const patch: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(fill)) if (v && !p[k]) patch[k] = v
  // state defaults to NV, so it follows a newly filled address
  if (state && patch.address_line1) patch.state = state
  // The old shop's live customer is canonical for imported accounts (replaces any test-mode id)
  if (linkStripe && c.gatewayId && p.stripe_customer_id !== c.gatewayId)
    patch.stripe_customer_id = c.gatewayId
  if (!Object.keys(patch).length) return
  await sb(`/rest/v1/profiles?id=eq.${user.id}`, { method: 'PATCH', body: JSON.stringify(patch) })
  patched++
})
console.log(`profiles: ${patched} filled in`)

// ------------------------------------------------------------------ legacy_customers
const legacyRows = snipCustomers
  .map((c) => {
    const user = userByEmail.get(lower(c.email))
    return (
      user && {
        user_id: user.id,
        snipcart_customer_id: c.id,
        snipcart_status: c.status ?? null,
        snipcart_created_at: c.creationDate ?? null,
        stripe_customer_id: c.gatewayId ?? null,
        cards: (c.gatewayId && cardsByCustomer.get(c.gatewayId)) || []
      }
    )
  })
  .filter(Boolean)
for (let i = 0; i < legacyRows.length; i += 500)
  await sb('/rest/v1/legacy_customers?on_conflict=user_id', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates',
    body: JSON.stringify(legacyRows.slice(i, i + 500))
  })
console.log(`legacy_customers: ${legacyRows.length} written`)

// ------------------------------------------------------------------ dogs (only for accounts with none)
const withPets = new Set((await selectAll('pets', 'user_id')).map((p: any) => p.user_id))
const pets = wpCustomers.flatMap((c) => {
  const user = userByEmail.get(lower(c.email))
  if (!user || withPets.has(user.id)) return []
  return (c.pets ?? [])
    .filter((p: any) => blank(p.name))
    .map((p: any) => {
      const d = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(p.dateOfBirth ?? '')
      return {
        user_id: user.id,
        name: blank(p.name)!.slice(0, 80),
        breed: blank(p.breed)?.slice(0, 80) ?? null,
        birth_date: d ? `${d[3]}-${d[1]}-${d[2]}` : null
      }
    })
})
if (pets.length) await sb('/rest/v1/pets', { method: 'POST', body: JSON.stringify(pets) })
console.log(`dogs: ${pets.length} added`)

// ------------------------------------------------------------------ orders + items
const imported = new Set((await selectAll('orders', 'legacy_id')).map((o: any) => o.legacy_id))
const pending = orders.filter((o) => !imported.has(o.order.legacy_id))
let orderCount = 0
let itemCount = 0
for (let i = 0; i < pending.length; i += 400) {
  const batch = pending.slice(i, i + 400)
  const rows = batch.map((o) => ({
    ...o.order,
    user_id: userByEmail.get(o.order.email)?.id ?? null
  }))
  const inserted: { id: string; legacy_id: string }[] = await sb(
    '/rest/v1/orders?select=id,legacy_id',
    {
      method: 'POST',
      prefer: 'return=representation',
      body: JSON.stringify(rows)
    }
  )
  const idByToken = new Map(inserted.map((r) => [r.legacy_id, r.id]))
  const items = batch.flatMap((o) =>
    o.items.map((it: any) => ({ ...it, order_id: idByToken.get(o.order.legacy_id) }))
  )
  await sb('/rest/v1/order_items', { method: 'POST', body: JSON.stringify(items) })
  orderCount += inserted.length
  itemCount += items.length
  console.log(`  orders ${orderCount}/${pending.length}`)
}
// Orders imported before: refresh what can change (status, refunds, who it belongs to)
const known = orders.filter((o) => imported.has(o.order.legacy_id))
for (let i = 0; i < known.length; i += 500)
  await sb('/rest/v1/orders?on_conflict=legacy_id', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=minimal',
    body: JSON.stringify(
      known.slice(i, i + 500).map((o) => ({
        ...o.order,
        user_id: userByEmail.get(o.order.email)?.id ?? null
      }))
    )
  })
console.log(
  `orders: ${orderCount} imported with ${itemCount} items, ${known.length} existing ones refreshed`
)

// ------------------------------------------------------------------ legacy_subscriptions
const initialItem = new Map(snipOrders.flatMap((o) => o.items.map((i: any) => [i.uniqueId, i])))
const subRows = snipSubs.map((s) => {
  const st = stripeSubs.get(s.gatewayId)
  const item = initialItem.get(s.itemId)
  const size = blank(s.metadata?.product?.size) ?? (item ? sizeOf(item) : null)
  const periodEnd = st?.items?.data?.[0]?.current_period_end
  return {
    id: s.gatewayId,
    snipcart_id: s.id,
    user_id: userByEmail.get(lower(s.user?.email))?.id ?? null,
    email: lower(s.user?.email),
    status: subStatus(s),
    title: blank(s.metadata?.product?.name) ?? blank(s.name) ?? 'Autoship',
    option: size,
    product_id: item ? matchProduct(String(item.id), size).product_id : null,
    quantity: Number(s.quantity) || 1,
    unit_amount: cents(s.amount),
    interval: PLURAL[s.schedule?.interval] ?? 'month',
    interval_count: Number(s.schedule?.intervalCount) || 1,
    next_billing_date:
      blank(s.nextBillingDate)?.slice(0, 10) ??
      (periodEnd ? new Date(periodEnd * 1000).toISOString().slice(0, 10) : null),
    card: card(st?.default_payment_method) ?? null,
    started_at: s.creationDate ?? null,
    paused_at: s.status === 'Paused' ? (s.pausedOn ?? null) : null
  }
})
await sb('/rest/v1/legacy_subscriptions?on_conflict=id', {
  method: 'POST',
  prefer: 'resolution=merge-duplicates',
  body: JSON.stringify(subRows)
})
console.log(`legacy_subscriptions: ${subRows.length} written`)
console.log('Done. Nothing was emailed and nothing was charged.')
