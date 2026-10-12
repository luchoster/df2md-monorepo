/**
 * Flavors: combines products that WordPress sold one-per-flavor into one product with a
 * `flavors[]` list and flavor + size variants, and splits flavors that were typed into the size
 * (both listed in flavor-groups.ts).
 *
 *   bun run flavors                 dry run: prints the plan, writes out/flavors-plan.txt
 *   bun run flavors --apply         writes to SANITY_DATASET (backup in out/ first)
 *   bun run flavors --only "<title or wpId>"   one group / fix
 *
 * Per group, the first product keeps its `_id` and gets the new title and slug (the old slug goes
 * to `legacy.previousSlugs`). Each flavor gets that product's main image, and its own description,
 * nutrition, feeding and ingredients whenever those differ between flavors (text that is the same
 * for every flavor stays on the product). The other products are archived with
 * `legacy.mergedInto`, so their URLs redirect to the combined product with the flavor picked.
 * Variant `_key`s (`v<wpVariationId>`) are kept, so nothing else needs rewriting.
 *
 * Re-running skips groups that are already merged. 03-load leaves merged products alone.
 */
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { FLAVOR_FIXES, FLAVOR_GROUPS, type FlavorFix, type FlavorGroup } from './flavor-groups'
import { argFlag, argValue, OUT_DIR } from './lib/env'
import { importClient } from './lib/sanity'

type Block = { _type: string; children?: { text?: string }[] }
type Doc = Record<string, any> & { _id: string; title: string; legacy?: Record<string, any> }

const apply = argFlag('apply')
const only = argValue('only')
const client = importClient()

const CONTENT = [
  'description',
  'nutritionalInfo',
  'feedingInstructions',
  'ingredientsAndUse'
] as const

const all: Doc[] = await client.fetch('*[_type == "product"]')
const drafts = new Set(all.filter((d) => d._id.startsWith('drafts.')).map((d) => d._id.slice(7)))
const published = all.filter((d) => !d._id.startsWith('drafts.') && !d._id.startsWith('versions.'))
const byWp = new Map(published.map((d) => [d.legacy?.wpId as number, d]))

const plan: string[] = []
const problems: string[] = []
const writes: { label: string; run: () => Promise<unknown> }[] = []
const touched: Doc[] = []

/** Every string in a value (block text, table cells, links), skipping keys, types and refs */
const strings = (value: unknown): string =>
  typeof value === 'string'
    ? value
    : Array.isArray(value)
      ? value.map(strings).join(' ')
      : value && typeof value === 'object'
        ? Object.entries(value)
            .filter(([k]) => !k.startsWith('_') && !['marks', 'style', 'asset'].includes(k))
            .map(([, v]) => strings(v))
            .join(' ')
        : ''

/** Portable Text (tables included: feeding charts are tables) → comparable plain text */
const plain = (blocks: Block[] | undefined) =>
  strings(blocks ?? [])
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

/** "4lbs" → "4 lbs", "13oz" → "13 oz", "5 lbs." → "5 lbs", "12 pack" → "12 Pack" */
const cleanOption = (option: string) =>
  option
    .trim()
    .replace(/\.$/, '')
    .replace(/(\d)\s*(lbs?|oz)\.?(?=\s|$)/gi, (_, d, unit) => `${d} ${unit.toLowerCase()}`)
    .replace(/\b(\d+)\s*pack\b/gi, '$1 Pack')
    .replace(/\s+/g, ' ')

const slugify = (title: string) =>
  title
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const matches = (label: string, wpIds: number[]) =>
  !only || label.toLowerCase().includes(only.toLowerCase()) || wpIds.includes(Number(only))

const strip = ({ _rev, _createdAt, _updatedAt, ...doc }: Doc) => doc

// ------------------------------------------------------------------ merges
const takenSlugs = new Set(published.map((d) => d.slug?.current))

function planGroup(group: FlavorGroup) {
  const members = group.flavors.map(([wpId, name]) => ({ wpId, name, doc: byWp.get(wpId) }))
  const missing = members.filter((m) => !m.doc).map((m) => m.wpId)
  if (missing.length) return problems.push(`${group.title}: no product for wpId ${missing}`)
  const docs = members.map((m) => m.doc!)
  const keep = docs[0]!
  if (keep.flavors?.length && docs.slice(1).every((d) => d.legacy?.mergedInto)) {
    plan.push(`= ${group.title}: already merged`)
    return
  }
  const blocked = docs.filter((d) => drafts.has(d._id) || d.status !== 'active' || d.flavors)
  if (blocked.length)
    return problems.push(
      `${group.title}: ${blocked.map((d) => `${d.legacy?.wpId} (${drafts.has(d._id) ? 'has unpublished draft' : d.flavors ? 'already has flavors' : d.status})`).join(', ')}, skipped`
    )

  // Text that every flavor has, word for word, stays on the product. Anything else moves to the
  // flavors, and a flavor that had none stays empty (it must not show a sibling's feeding chart).
  const shared: Record<string, unknown> = {}
  const perFlavor = new Set<string>()
  for (const field of CONTENT) {
    const texts = docs.map((d) => plain(d[field]))
    if (texts.every((t) => t === texts[0])) shared[field] = texts[0] ? docs[0]![field] : undefined
    else perFlavor.add(field)
  }
  const shorts = new Set(docs.map((d) => d.shortDescription?.trim()).filter(Boolean))

  const flavors = members.map(({ wpId, name, doc }) => ({
    _key: `f${wpId}`,
    _type: 'flavor',
    name,
    ...(doc!.mainImage?.asset ? { image: doc!.mainImage } : {}),
    ...Object.fromEntries([...perFlavor].filter((f) => plain(doc![f])).map((f) => [f, doc![f]]))
  }))

  const variants = members.flatMap(({ name, doc }) =>
    (doc!.variants ?? []).map((v: Record<string, any>) => {
      const option = cleanOption(v.option ?? '')
      return { ...v, flavor: name, option: group.options?.[option] ?? option }
    })
  )
  const labels = variants.map((v) => `${v.flavor} · ${v.option}`.toLowerCase())
  const dupe = labels.find((l, i) => labels.indexOf(l) !== i)
  if (dupe) return problems.push(`${group.title}: "${dupe}" twice, skipped`)
  const keys = new Set(variants.map((v) => v._key))
  if (keys.size !== variants.length) return problems.push(`${group.title}: duplicate variant keys`)

  const seenImages = new Set([keep.mainImage?.asset?._ref])
  const gallery = docs
    .flatMap((d) => d.gallery ?? [])
    .filter((img: any) => {
      const ref = img?.asset?._ref
      if (!ref || seenImages.has(ref)) return false
      seenImages.add(ref)
      return true
    })
  const byRef = <T extends { _ref: string }>(refs: T[]) =>
    refs.filter((r, i) => refs.findIndex((o) => o._ref === r._ref) === i)
  const categories = byRef(docs.flatMap((d) => d.categories ?? []))
  const tags = [...new Set(docs.flatMap((d) => d.tags ?? []))]

  const base = slugify(group.title)
  let slug = base
  for (let n = 2; takenSlugs.has(slug) && slug !== keep.slug?.current; n++) slug = `${base}-${n}`
  takenSlugs.add(slug)
  const oldSlug = keep.slug?.current
  const previousSlugs = [
    ...new Set([...(keep.legacy?.previousSlugs ?? []), oldSlug].filter((s) => s && s !== slug))
  ]

  const merged: Doc = {
    ...strip(keep),
    title: group.title,
    slug: { _type: 'slug', current: slug },
    mainImage: keep.mainImage?.asset
      ? keep.mainImage
      : docs.find((d) => d.mainImage?.asset)?.mainImage,
    featured: docs.some((d) => d.featured),
    autoshipEligible: docs.every((d) => d.autoshipEligible !== false),
    noDiscounts: docs.some((d) => d.noDiscounts),
    categories,
    gallery: [...(keep.gallery ?? []), ...gallery.filter((g: any) => !keep.gallery?.includes(g))],
    flavors,
    optionName: group.optionName ?? keep.optionName ?? 'Size',
    variants,
    defaultVariantKey: variants.some((v) => v._key === keep.defaultVariantKey)
      ? keep.defaultVariantKey
      : variants[0]?._key,
    legacy: { ...keep.legacy, mergedFlavor: members[0]!.name, previousSlugs }
  }
  if (tags.length) merged.tags = tags
  if (!merged.mainImage) delete merged.mainImage
  if (!merged.gallery.length) delete merged.gallery
  for (const field of CONTENT) {
    if (perFlavor.has(field) || !shared[field]) delete merged[field]
    else merged[field] = shared[field]
  }
  if (shorts.size > 1) delete merged.shortDescription
  const seo = new Set(docs.map((d) => JSON.stringify(d.seo ?? null)))
  if (seo.size > 1) delete merged.seo
  const blocksElsewhere = docs
    .slice(1)
    .filter((d) => d.blocksAbove?.length || d.blocksBelow?.length)
  if (blocksElsewhere.length)
    problems.push(
      `${group.title}: page blocks on ${blocksElsewhere.map((d) => d.legacy?.wpId)} are dropped`
    )

  plan.push(
    [
      `+ ${group.title}  /shop/${slug}  (keeps ${keep.legacy?.wpId}, archives ${docs.length - 1})`,
      `    per flavor: ${[...perFlavor].join(', ') || 'nothing'}${shorts.size > 1 ? ' (short descriptions differ: dropped)' : ''}`,
      ...members.map(({ wpId, name, doc }) => {
        const own = variants.filter((v) => v.flavor === name)
        return `    ${String(wpId).padStart(5)} ${name.padEnd(32)} ${own.map((v) => `${v.option} $${v.price}${v.inStock === false ? ' (out)' : ''}`).join(', ')}${doc!.mainImage?.asset ? '' : '  [no image]'}`
      })
    ].join('\n')
  )
  touched.push(...docs)
  writes.push({
    label: group.title,
    run: () => {
      const tx = client.transaction().createOrReplace(merged as any)
      for (const { name, doc } of members.slice(1))
        tx.patch(doc!._id, (p) =>
          p.ifRevisionId(doc!._rev).set({
            status: 'archived',
            'legacy.mergedInto': { _type: 'reference', _ref: keep._id, _weak: true },
            'legacy.mergedFlavor': name
          })
        )
      return tx.commit({ visibility: 'async' })
    }
  })
}

// ------------------------------------------------------------------ in-place fixes
function planFix(fix: FlavorFix) {
  const doc = byWp.get(fix.wpId)
  if (!doc) return problems.push(`fix ${fix.wpId}: no product`)
  if (doc.flavors?.length) return plan.push(`= ${doc.title}: already split`)
  if (drafts.has(doc._id))
    return problems.push(`fix ${fix.wpId}: has an unpublished draft, skipped`)
  const unknown = (doc.variants ?? []).filter((v: any) => !fix.split[v.option])
  if (unknown.length)
    return problems.push(
      `fix ${fix.wpId}: no mapping for ${unknown.map((v: any) => `"${v.option}"`).join(', ')}`
    )
  const variants = (doc.variants ?? []).map((v: any) => {
    const [flavor, option] = fix.split[v.option]!
    return { ...v, flavor, option: cleanOption(option) }
  })
  const names = [...new Set(variants.map((v: any) => v.flavor as string))]
  const flavors = names.map((name, i) => ({ _key: `f${fix.wpId}-${i}`, _type: 'flavor', name }))
  plan.push(
    `~ ${doc.title} (${fix.wpId}): ${variants.map((v: any) => `${v.flavor} · ${v.option}`).join(', ')}${fix.optionName ? ` [${fix.optionName}]` : ''}`
  )
  touched.push(doc)
  writes.push({
    label: doc.title,
    run: () =>
      client
        .patch(doc._id)
        .ifRevisionId(doc._rev)
        .set({ variants, flavors, ...(fix.optionName ? { optionName: fix.optionName } : {}) })
        .commit({ visibility: 'async' })
  })
}

for (const group of FLAVOR_GROUPS)
  if (
    matches(
      group.title,
      group.flavors.map(([id]) => id)
    )
  )
    planGroup(group)
for (const fix of FLAVOR_FIXES)
  if (matches(byWp.get(fix.wpId)?.title ?? '', [fix.wpId])) planFix(fix)

const report = [
  ...plan,
  '',
  problems.length ? `Problems (${problems.length}):` : 'No problems.',
  ...problems.map((p) => `  ! ${p}`)
].join('\n')
writeFileSync(join(OUT_DIR, 'flavors-plan.txt'), `${report}\n`)
console.log(report)
const archived = touched.length - writes.length
console.log(
  `\n${writes.length} writes: ${touched.length} products in, ${writes.length} out (${archived} archived and redirected)`
)

if (!apply) {
  console.log('Dry run. Pass --apply to write.')
  process.exit(0)
}
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const backup = join(OUT_DIR, `flavors-backup-${stamp}.json`)
writeFileSync(backup, JSON.stringify(touched, null, 1))
console.log(`Backup of ${touched.length} products → ${backup}`)
for (const w of writes) {
  try {
    await w.run()
    console.log(`  ✓ ${w.label}`)
  } catch (error: any) {
    console.error(`  ✗ ${w.label}: ${error?.message}`)
  }
}
console.log(`Done → ${client.config().dataset}`)
