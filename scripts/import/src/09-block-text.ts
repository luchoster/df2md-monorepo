/**
 * One-off: block text fields that were plain text areas are Portable Text (`simple-content`) now.
 * Converts the plain strings already saved (published docs, drafts and release versions) into
 * paragraphs, one per line. The site renders both shapes, so the order of deploy and migration
 * doesn't matter.
 *
 *   bun run block-text            dry run: lists what would change
 *   bun run block-text --apply    SANITY_DATASET (production by default)
 */
import { randomUUID } from 'node:crypto'
import { argFlag } from './lib/env'
import { importClient } from './lib/sanity'

/** block _type → its converted fields; `list.field` = a field on each item of an array */
const FIELDS: Record<string, string[]> = {
  'feature-photo': ['description'],
  'feature-split': ['description'],
  'about-intro': ['description'],
  'faq-search': ['description'],
  steps: ['description', 'steps.description'],
  'feature-grid': ['features.description'],
  'feature-rows': ['subheading', 'rows.description'],
  'reviews-embed': ['reviews.text']
}

const key = () => randomUUID().replace(/-/g, '').slice(0, 12)
const toBlocks = (text: string) =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({
      _type: 'block',
      _key: key(),
      style: 'normal',
      markDefs: [],
      children: [{ _type: 'span', _key: key(), text: line, marks: [] }]
    }))

type Change = { id: string; path: string; from: string; to: ReturnType<typeof toBlocks> }

/** Finds converted block types anywhere in a document and returns key-addressed patches. */
function changesIn(doc: any): Change[] {
  const out: Change[] = []
  const walk = (node: any, path: string) => {
    if (Array.isArray(node)) {
      for (const item of node)
        if (item && typeof item === 'object')
          walk(item, item._key ? `${path}[_key=="${item._key}"]` : path)
      return
    }
    if (!node || typeof node !== 'object') return
    for (const spec of FIELDS[node._type] ?? []) {
      const [list, field] = spec.includes('.') ? spec.split('.') : [null, spec]
      const targets = list
        ? ((node[list] ?? []) as any[]).map((item) => ({
            item,
            at: `${path}.${list}[_key=="${item?._key}"].${field}`
          }))
        : [{ item: node, at: `${path}.${field}` }]
      for (const { item, at } of targets) {
        const value = item?.[field!]
        if (typeof value === 'string' && (!list || item._key))
          out.push({ id: doc._id, path: at.replace(/^\./, ''), from: value, to: toBlocks(value) })
      }
    }
    for (const [k, v] of Object.entries(node))
      if (!k.startsWith('_') && v && typeof v === 'object') walk(v, `${path}.${k}`)
  }
  walk(doc, '')
  return out
}

const client = importClient()
const apply = argFlag('apply')
const docs = await client.fetch<any[]>(`*[_type in ["page", "homePage", "product"]]`)
const changes = docs.flatMap(changesIn)
const byDoc = Map.groupBy(changes, (c) => c.id)
console.log(
  `${client.config().dataset}: ${changes.length} text fields in ${byDoc.size} documents (of ${docs.length})`
)
for (const c of changes.slice(0, 15))
  console.log(`  ${c.id} ${c.path}: "${c.from.slice(0, 60)}" → ${c.to.length} paragraph(s)`)
if (!apply) {
  console.log('Dry run: nothing changed. Add --apply to convert.')
  process.exit(0)
}
const tx = client.transaction()
for (const [id, list] of byDoc)
  tx.patch(id, (p) => p.set(Object.fromEntries(list.map((c) => [c.path, c.to]))))
await tx.commit({ visibility: 'sync' })
console.log(`${changes.length} fields converted`)
