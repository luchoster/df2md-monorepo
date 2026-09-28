/**
 * Step 6 of the plan (§3): checks the dataset against out/wp.json. Exit 1 on any mismatch.
 *
 *   bun run verify
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { OUT_DIR } from './lib/env'
import { brandKey } from './lib/refs'
import { importClient } from './lib/sanity'
import type { WpDump } from './lib/wp'

const wp: WpDump = JSON.parse(readFileSync(join(OUT_DIR, 'wp.json'), 'utf8'))
const expected: Record<string, number> = {}
for (const d of JSON.parse(readFileSync(join(OUT_DIR, 'documents.json'), 'utf8')) as {
  _type: string
}[])
  expected[d._type] = (expected[d._type] ?? 0) + 1
const client = importClient()
const failures: string[] = []
const check = (ok: boolean, message: string) => {
  if (!ok) failures.push(message)
  console.log(`${ok ? '✓' : '✗'} ${message}`)
}

const q = `{
  "counts": {
    "brand": count(*[_type == "brand" && !(_id in path("drafts.**"))]),
    "category": count(*[_type == "category" && !(_id in path("drafts.**"))]),
    "product": count(*[_type == "product" && defined(legacy.wpId) && !(_id in path("drafts.**"))]),
    "page": count(*[_type == "page" && defined(legacy.wpId) && !(_id in path("drafts.**"))]),
    "homePage": count(*[_id == "homePage"]),
    "siteSettings": count(*[_id == "siteSettings"])
  },
  "variants": count(*[_type == "product" && defined(legacy.wpId)].variants[]),
  "featured": count(*[_type == "product" && featured == true && !(_id in path("drafts.**"))]),
  "danglingBrand": *[_type == "product" && defined(brand) && !defined(brand->_id)].legacy.wpId,
  "danglingCategory": *[_type == "product" && count(categories[!defined(@->_id)]) > 0].legacy.wpId,
  "danglingParent": *[_type == "category" && defined(parent) && !defined(parent->_id)].legacy.termId,
  "unpriced": *[_type == "product" && status == "active" && count(variants[price > 0]) == 0].legacy.wpId,
  "brokenImages": count(*[_type == "product" && defined(mainImage) && !defined(mainImage.asset->_id)])
}`
const r = await client.fetch(q)

for (const [type, n] of Object.entries(expected))
  check(r.counts[type] === n, `${type}: ${r.counts[type]} / ${n}`)
const wpVariants = wp.products.reduce((n, p) => n + p.variants.length, 0)
check(
  Math.abs(r.variants - wpVariants) <= 5,
  `variants: ${r.variants} / ${wpVariants} (unpriced ones are dropped)`
)
check(r.featured === wp.products.filter((p) => p.featured).length, `featured: ${r.featured}`)
check(!r.danglingBrand.length, `products with dangling brand: ${r.danglingBrand.join(', ') || 0}`)
check(
  !r.danglingCategory.length,
  `products with dangling category: ${r.danglingCategory.join(', ') || 0}`
)
check(
  !r.danglingParent.length,
  `categories with dangling parent: ${r.danglingParent.join(', ') || 0}`
)
check(!r.unpriced.length, `active products without a price: ${r.unpriced.join(', ') || 0}`)
check(r.brokenImages === 0, `products whose image asset is missing: ${r.brokenImages}`)

// Sample 20 products and diff against WordPress
const sample = [...wp.products].sort(() => Math.random() - 0.5).slice(0, 20)
const docs: any[] = await client.fetch(
  `*[_type == "product" && legacy.wpId in $ids]{
    legacy, title, "brand": brand->legacy.acfValue, "categories": categories[]->legacy.termId,
    variants[]{_key, option, price}
  }`,
  { ids: sample.map((p) => p.wpId) }
)
for (const p of sample) {
  const d = docs.find((x) => x.legacy.wpId === p.wpId)
  if (!d) {
    check(false, `product ${p.wpId} missing`)
    continue
  }
  const problems: string[] = []
  if (d.title !== p.title.replace(/\s+/g, ' ').trim())
    problems.push(`title "${d.title}" ≠ "${p.title}"`)
  if (p.brand && brandKey(d.brand ?? '') !== brandKey(p.brand) && d.brand !== p.brand)
    problems.push(`brand ${d.brand} ≠ ${p.brand}`)
  const cats = new Set(d.categories)
  if (p.categoryIds.some((id) => !cats.has(id))) problems.push('categories differ')
  for (const v of p.variants) {
    const dv = d.variants.find((x: any) => x._key === `v${v.wpId}`)
    const price = v.price ?? v.regularPrice
    if (!dv) {
      if (price) problems.push(`variant ${v.wpId} missing`)
    } else if (dv.price !== price) problems.push(`variant ${v.wpId} price ${dv.price} ≠ ${price}`)
  }
  check(
    !problems.length,
    `product ${p.wpId} ${p.title}${problems.length ? `: ${problems.join('; ')}` : ''}`
  )
}

console.log(failures.length ? `\n${failures.length} check(s) failed` : '\nAll checks passed')
process.exit(failures.length ? 1 : 0)
