/**
 * Cutover step: Autoships the old shop (Snipcart) "paused" with a 100%-off coupon become
 * properly paused Stripe subscriptions (pause_collection, invoices voided), and the coupon goes.
 * Without this, each of them would still renew at $0 every cycle once our webhook takes over.
 *
 *   bun run autoship:pause                          dry run with STRIPE_READ_KEY (live, read-only)
 *   bun run autoship:pause --key STRIPE_SECRET_KEY --apply
 *
 * `--key` names the env var holding the Stripe key to use (the sandbox key for a test run, the
 * live secret key at cutover). Run it only once Snipcart is switched off: while Snipcart runs, a
 * customer resuming there would drop its coupon but stay paused here.
 */
import { argFlag, argValue } from './lib/env'

const apply = argFlag('apply')
const keyName = argValue('key') ?? 'STRIPE_READ_KEY'
const key = process.env[keyName]
if (!key) throw new Error(`Missing env var ${keyName}`)
if (apply && key.startsWith('rk_')) throw new Error(`${keyName} is read-only; pass --key`)
const mode = key.includes('_live_') ? 'LIVE' : 'test'

async function stripe(path: string, body?: URLSearchParams): Promise<any> {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`https://api.stripe.com/v1/${path}`, {
      method: body ? 'POST' : 'GET',
      // Same API version as the site's Stripe SDK (the account default is 2018-era)
      headers: { Authorization: `Bearer ${key}`, 'Stripe-Version': '2026-08-26.dahlia' },
      body
    })
    const json = await res.json()
    if (res.ok) return json
    if (res.status < 500 && res.status !== 429)
      throw new Error(`Stripe ${path}: ${json.error?.message}`)
    if (attempt >= 5) throw new Error(`Stripe ${path}: ${res.status}`)
    await Bun.sleep(500 * attempt)
  }
}

const subs: any[] = []
for (const status of ['active', 'trialing', 'past_due']) {
  let after = ''
  for (;;) {
    const page = await stripe(
      `subscriptions?status=${status}&limit=100&expand[]=data.discounts.source.coupon${after ? `&starting_after=${after}` : ''}`
    )
    subs.push(...page.data)
    if (!page.has_more) break
    after = page.data.at(-1).id
  }
}

const isPauseCoupon = (d: any) => (d?.source?.coupon ?? d?.coupon)?.percent_off === 100
const targets = subs.filter(
  (s) =>
    s.metadata?.snipcart_subscription_id && !s.pause_collection && s.discounts.some(isPauseCoupon)
)
console.log(
  `${mode} Stripe: ${subs.length} live subscriptions, ${subs.filter((s) => s.metadata?.snipcart_subscription_id).length} from Snipcart, ${targets.length} paused with a 100%-off coupon`
)
for (const s of targets.slice(0, 5))
  console.log(`  ${s.id} ${s.metadata.snipcart_subscription_id} → pause_collection, remove coupon`)
if (!apply) {
  console.log('Dry run: nothing changed. Add --key <ENV> --apply to convert.')
  process.exit(0)
}

let done = 0
for (const s of targets) {
  const body = new URLSearchParams({ 'pause_collection[behavior]': 'void' })
  const keep = s.discounts.filter((d: any) => !isPauseCoupon(d))
  if (keep.length) for (const [i, d] of keep.entries()) body.set(`discounts[${i}][discount]`, d.id)
  else body.set('discounts', '')
  await stripe(`subscriptions/${s.id}`, body)
  done++
}
console.log(`${done} Autoships converted to a Stripe pause`)
