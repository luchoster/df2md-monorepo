/**
 * Plan §4: downloads the old shop's data from the Snipcart API (read-only) into
 * ~/Sites/dogfood/backups/snipcart/{customers,orders,subscriptions}.json, for 07-customers.
 *
 *   bun run snipcart:export
 *
 * The files hold customers' personal data: they stay in backups/, outside the repo.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT } from './lib/env'

const key = process.env.SNIPCART_API_AUTH
if (!key) throw new Error('Missing env var SNIPCART_API_AUTH')
const OUT = process.env.SNIPCART_EXPORT ?? join(ROOT, '..', '..', '..', 'backups', 'snipcart')
const auth = `Basic ${btoa(`${key}:`)}`

async function get(path: string): Promise<any> {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`https://app.snipcart.com/api/${path}`, {
      headers: { Authorization: auth, Accept: 'application/json' }
    })
    if (res.ok) return res.json()
    if (attempt >= 5) throw new Error(`Snipcart ${path}: ${res.status}`)
    await Bun.sleep(1000 * attempt)
  }
}

mkdirSync(OUT, { recursive: true })
for (const resource of ['customers', 'orders', 'subscriptions']) {
  const all: unknown[] = []
  let total = Number.POSITIVE_INFINITY
  while (all.length < total) {
    const page = await get(`${resource}?limit=200&offset=${all.length}`)
    total = page.totalItems
    if (!page.items.length) break
    all.push(...page.items)
  }
  writeFileSync(join(OUT, `${resource}.json`), JSON.stringify(all, null, 1))
  console.log(`${resource}: ${all.length}/${total}`)
}
