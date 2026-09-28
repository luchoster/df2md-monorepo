/**
 * Step 5 of the plan (§3): out/documents.json → Sanity.
 *
 *   bun run load [--dry-run] [--offline] [--production] [--fetch-remote]
 *
 * --dry-run       resolve ids and images, write nothing (uploads skipped)
 * --offline       with --dry-run: don't query Sanity either (every document counts as new)
 * --production    required when SANITY_DATASET=production
 * --fetch-remote  download images missing from uploads/ from their original URL
 *
 * Idempotent: documents are matched on their legacy key (`legacy.wpId`, `legacy.termId`,
 * `legacy.acfValue`); a match is replaced in place, anything else gets a fresh random `_id`.
 * Stripe ids already written to variants by 05-stripe-sync are carried over.
 */
import { randomUUID } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import type { SanityClient } from '@sanity/client'
import { argFlag, OUT_DIR, UPLOADS_DIR } from './lib/env'
import { brandKey, isLegacyRef } from './lib/refs'
import { importClient } from './lib/sanity'

type Doc = Record<string, any> & { _type: string; _id?: string; _legacyKey?: string }
type WpImage = { attachmentId?: number; file?: string | null; src?: string }

const dryRun = argFlag('dry-run')
const offline = dryRun && argFlag('offline')
const fetchRemote = argFlag('fetch-remote')
const client: SanityClient | null = offline ? null : importClient()

const docs: Doc[] = JSON.parse(readFileSync(join(OUT_DIR, 'documents.json'), 'utf8'))
const problems: { where: string; message: string }[] = []

// ------------------------------------------------------------------ 1. resolve ids
const idByLegacyKey = new Map<string, string>()
if (client) {
  const existing: { _id: string; _type: string; legacy: Record<string, any> }[] =
    await client.fetch(
      `*[_type in ["brand", "category", "product", "page"] && defined(legacy) && !(_id in path("drafts.**"))]{_id, _type, legacy}`
    )
  for (const d of existing) {
    const k =
      d._type === 'brand'
        ? d.legacy.acfValue && `brand:${brandKey(d.legacy.acfValue)}`
        : d._type === 'category'
          ? d.legacy.termId && `category:${d.legacy.termId}`
          : d.legacy.wpId && `${d._type}:${d.legacy.wpId}`
    if (k) idByLegacyKey.set(k, d._id)
  }
}
let created = 0
for (const doc of docs) {
  if (doc._id) continue // singletons
  const k = doc._legacyKey!
  let id = idByLegacyKey.get(k)
  if (!id) {
    id = randomUUID()
    idByLegacyKey.set(k, id)
    created++
  }
  doc._id = id
}
console.log(`${docs.length} documents: ${docs.length - created} update, ${created} create`)

// ------------------------------------------------------------------ 2. images
const assetCachePath = join(OUT_DIR, 'assets.json')
const assetCache: Record<string, string | null> = existsSync(assetCachePath)
  ? JSON.parse(readFileSync(assetCachePath, 'utf8'))
  : {}

const imageNodes: { node: Record<string, any>; img: WpImage }[] = []
const collect = (value: unknown) => {
  if (Array.isArray(value)) value.forEach(collect)
  else if (value && typeof value === 'object') {
    const node = value as Record<string, any>
    if (node._wpImage) imageNodes.push({ node, img: node._wpImage })
    Object.values(node).forEach(collect)
  }
}
docs.forEach(collect)
const imageKey = (img: WpImage) => (img.attachmentId ? `wp:${img.attachmentId}` : `url:${img.src}`)
const uniqueImages = new Map(imageNodes.map(({ img }) => [imageKey(img), img]))

async function readImage(img: WpImage): Promise<{ data: Buffer; filename: string } | null> {
  if (img.file) {
    const path = join(UPLOADS_DIR, img.file)
    if (existsSync(path)) return { data: readFileSync(path), filename: basename(path) }
  }
  // Hotlinked images from brand sites were never in uploads/; WP ones only with --fetch-remote
  const isWp = img.src?.includes('dogfood2mydoor.com')
  if (img.src && (!isWp || fetchRemote)) {
    try {
      const res = await fetch(img.src)
      if (res.ok)
        return {
          data: Buffer.from(await res.arrayBuffer()),
          filename: basename(new URL(img.src).pathname)
        }
    } catch {}
  }
  return null
}

let uploaded = 0
let missing = 0
const pending = [...uniqueImages].filter(([k]) => !(k in assetCache))
console.log(`${uniqueImages.size} images, ${pending.length} not yet uploaded`)
for (let i = 0; i < pending.length; i += 6) {
  await Promise.all(
    pending.slice(i, i + 6).map(async ([k, img]) => {
      const file = await readImage(img)
      if (!file) {
        missing++
        problems.push({ where: k, message: `image not found (${img.file ?? img.src})` })
        if (!dryRun) assetCache[k] = null
        return
      }
      if (dryRun || !client) return
      const asset = await client.assets.upload('image', file.data, { filename: file.filename })
      assetCache[k] = asset._id
      uploaded++
    })
  )
  if (!dryRun) writeFileSync(assetCachePath, JSON.stringify(assetCache, null, 1))
  if (i && i % 60 === 0) console.log(`  images ${i}/${pending.length}`)
}
console.log(`images: ${uploaded} uploaded, ${missing} missing`)

// ------------------------------------------------------------------ 3. rewrite placeholders
const REMOVE = Symbol('remove')
function rewrite(value: any, where: string): any {
  if (Array.isArray(value)) return value.map((v) => rewrite(v, where)).filter((v) => v !== REMOVE)
  if (!value || typeof value !== 'object') return value
  if (value._wpImage) {
    const assetId = assetCache[imageKey(value._wpImage)]
    if (!assetId) return dryRun ? { ...value, _wpImage: undefined } : REMOVE
    const { _wpImage, ...rest } = value
    return { ...rest, asset: { _type: 'reference', _ref: assetId } }
  }
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(value)) {
    if (k === '_legacyKey') continue
    if (k === '_ref' && isLegacyRef(v)) {
      const id = idByLegacyKey.get(v.slice('legacy:'.length))
      if (!id) throw new Error(`${where}: dangling reference ${v}`)
      out[k] = id
      continue
    }
    const next = rewrite(v, where)
    if (next !== REMOVE && next !== undefined) out[k] = next
  }
  return out
}
const final: Doc[] = docs.map((d) => rewrite(d, d._legacyKey ?? d._id!))

// ------------------------------------------------------------------ 4. keep Stripe ids
if (client) {
  const synced: { _id: string; v: { _key: string; stripe: unknown }[] }[] = await client.fetch(
    '*[_type == "product" && count(variants[defined(stripe.priceId)]) > 0]{_id, "v": variants[defined(stripe.priceId)]{_key, stripe}}'
  )
  const byId = new Map(synced.map((p) => [p._id, new Map(p.v.map((x) => [x._key, x.stripe]))]))
  for (const doc of final) {
    const stripe = byId.get(doc._id!)
    if (!stripe) continue
    for (const v of doc.variants ?? []) if (stripe.has(v._key)) v.stripe = stripe.get(v._key)
  }
}

// ------------------------------------------------------------------ 5. write
writeFileSync(join(OUT_DIR, 'load-problems.json'), JSON.stringify(problems, null, 1))
if (dryRun || !client) {
  writeFileSync(join(OUT_DIR, 'final.json'), JSON.stringify(final))
  console.log(
    `Dry run: nothing written. Final documents in out/final.json, problems in out/load-problems.json`
  )
  process.exit(0)
}
const BATCH = 50
for (let i = 0; i < final.length; i += BATCH) {
  const tx = client.transaction()
  for (const doc of final.slice(i, i + BATCH)) tx.createOrReplace(doc as any)
  await tx.commit({ visibility: 'async' })
  console.log(`  committed ${Math.min(i + BATCH, final.length)}/${final.length}`)
}
console.log(
  `Done → ${client.config().dataset}. ${problems.length} problems in out/load-problems.json`
)
