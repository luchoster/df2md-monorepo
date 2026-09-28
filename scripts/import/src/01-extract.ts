/**
 * Step 2 of the plan (§3): WordPress dump → out/wp.json (+ out/customers.json).
 *
 *   bun run extract [--dump path/to/backup.sql.gz] [--include-drafts]
 *
 * Reads the mysqldump directly (no MySQL/Docker needed) and asserts the inventory counts from
 * the plan, failing loudly if they drift.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { argFlag, argValue, DUMP_PATH, OUT_DIR, TABLE_PREFIX } from './lib/env'
import { phpList, tryUnserialize } from './lib/php'
import { type Row, readDump } from './lib/sqldump'
import type {
  WpAttachment,
  WpBrand,
  WpCategory,
  WpCustomer,
  WpDump,
  WpHeroSlide,
  WpMenuItem,
  WpPage,
  WpProduct,
  WpVariant
} from './lib/wp'

const EXPECTED = {
  products: 690,
  // The plan said 1,845, but that counts variations whose parent is a draft (700), pending (16) or
  // private (2) product. Published products own 1,127.
  variants: 1127,
  categories: 43,
  brands: 81,
  pages: 10,
  featured: 16
}

const includeDrafts = argFlag('include-drafts')
const dumpPath = argValue('dump') ?? DUMP_PATH
const t = (name: string) => `${TABLE_PREFIX}${name}`

console.log(`Reading ${dumpPath} …`)
const tables = await readDump(dumpPath, [
  t('posts'),
  t('postmeta'),
  t('terms'),
  t('term_taxonomy'),
  t('term_relationships'),
  t('termmeta'),
  t('users'),
  t('usermeta')
])
const posts = tables[t('posts')]!
console.log(
  Object.entries(tables)
    .map(([k, v]) => `${k}: ${v.length}`)
    .join(', ')
)

// ---------- helpers ----------
function group<K, V>(map: Map<K, V>, key: K, init: () => V): V {
  let value = map.get(key)
  if (value === undefined) {
    value = init()
    map.set(key, value)
  }
  return value
}
const num = (v: string | null | undefined) => {
  if (v == null || v.trim() === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
const int = (v: string | null | undefined) => {
  const n = num(v)
  return n == null || n === 0 ? null : Math.trunc(n)
}
const str = (v: string | null | undefined) => (v == null || v.trim() === '' ? null : v)

const metaByPost = new Map<number, Record<string, string | null>>()
for (const r of tables[t('postmeta')]!) {
  const id = Number(r.post_id)
  const m = group(metaByPost, id, () => ({}) as Record<string, string | null>)
  m[r.meta_key!] = r.meta_value ?? null
}
const meta = (id: number) => metaByPost.get(id) ?? {}

const seoOf = (m: Record<string, string | null>) => {
  const out: { title?: string; description?: string } = {}
  if (str(m._yoast_wpseo_title)) out.title = m._yoast_wpseo_title!
  if (str(m._yoast_wpseo_metadesc)) out.description = m._yoast_wpseo_metadesc!
  return out
}

// ---------- taxonomy ----------
const terms = new Map(tables[t('terms')]!.map((r) => [Number(r.term_id), r]))
const taxonomies = tables[t('term_taxonomy')]!
const taxById = new Map(taxonomies.map((r) => [Number(r.term_taxonomy_id), r]))
const termMeta = new Map<number, Record<string, string | null>>()
for (const r of tables[t('termmeta')]!) {
  const id = Number(r.term_id)
  const m = group(termMeta, id, () => ({}) as Record<string, string | null>)
  m[r.meta_key!] = r.meta_value ?? null
}
/** object id → [{ taxonomy, termId, name, slug }] */
const termsByObject = new Map<
  number,
  { taxonomy: string; termId: number; name: string; slug: string }[]
>()
for (const r of tables[t('term_relationships')]!) {
  const tax = taxById.get(Number(r.term_taxonomy_id))
  if (!tax) continue
  const term = terms.get(Number(tax.term_id))
  if (!term) continue
  const id = Number(r.object_id)
  const list = group(termsByObject, id, () => [])
  list.push({
    taxonomy: tax.taxonomy!,
    termId: Number(tax.term_id),
    name: term.name!,
    slug: term.slug!
  })
}
const termsOf = (id: number, taxonomy: string) =>
  (termsByObject.get(id) ?? []).filter((x) => x.taxonomy === taxonomy)

const categories: WpCategory[] = taxonomies
  .filter((r) => r.taxonomy === 'product_cat')
  .map((r) => {
    const termId = Number(r.term_id)
    const term = terms.get(termId)!
    const tm = termMeta.get(termId) ?? {}
    return {
      termId,
      name: decodeEntities(term.name!),
      slug: term.slug!,
      description: r.description ?? '',
      parent: int(r.parent),
      order: num(tm.order) ?? 0,
      thumbnailId: int(tm.thumbnail_id)
    }
  })

// ---------- brands (ACF select choices) ----------
const brandField = posts.find(
  (p) => p.post_type === 'acf-field' && p.post_name === 'field_59dfbe8c3786e'
)
if (!brandField) throw new Error('ACF brand field field_59dfbe8c3786e not found')
const brandConfig = tryUnserialize(brandField.post_content)
const choices =
  brandConfig && typeof brandConfig === 'object' && typeof brandConfig.choices === 'object'
    ? (brandConfig.choices as Record<string, string>)
    : {}
const brands: WpBrand[] = Object.entries(choices).map(([value, label]) => ({
  value,
  label: decodeEntities(String(label))
}))

// ---------- attachments ----------
const attachments: Record<string, WpAttachment> = {}
for (const p of posts) {
  if (p.post_type !== 'attachment') continue
  const id = Number(p.ID)
  const m = meta(id)
  attachments[id] = {
    id,
    file: str(m._wp_attached_file),
    url: p.guid ?? '',
    mime: p.post_mime_type ?? '',
    alt: str(m._wp_attachment_image_alt),
    title: p.post_title ?? ''
  }
}

// ---------- products + variations ----------
const productStatuses = includeDrafts ? ['publish', 'draft', 'pending'] : ['publish']
const variationsByParent = new Map<number, Row[]>()
for (const p of posts) {
  if (p.post_type !== 'product_variation' || p.post_status !== 'publish') continue
  const parent = Number(p.post_parent)
  const list = group(variationsByParent, parent, () => [])
  list.push(p)
}

const toVariant = (p: Row): WpVariant => {
  const id = Number(p.ID)
  const m = meta(id)
  const attributes: Record<string, string> = {}
  for (const [k, v] of Object.entries(m))
    if (k.startsWith('attribute_'))
      attributes[k.slice('attribute_'.length)] = decodeEntities(v ?? '')
  return {
    wpId: id,
    status: p.post_status!,
    menuOrder: Number(p.menu_order ?? 0),
    attributes,
    sku: str(m._sku),
    price: num(m._price),
    regularPrice: num(m._regular_price),
    salePrice: num(m._sale_price),
    stockStatus: str(m._stock_status),
    manageStock: m._manage_stock === 'yes',
    stock: num(m._stock),
    weight: num(m._weight),
    length: num(m._length),
    width: num(m._width),
    height: num(m._height),
    description: str(m._variation_description),
    thumbnailId: int(m._thumbnail_id)
  }
}

const products: WpProduct[] = posts
  .filter((p) => p.post_type === 'product' && productStatuses.includes(p.post_status!))
  .map((p) => {
    const id = Number(p.ID)
    const m = meta(id)
    const attrs = tryUnserialize(m._product_attributes)
    const attributes = phpList(attrs)
      .filter((a): a is Record<string, any> => !!a && typeof a === 'object')
      .sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0))
      .map((a) => ({
        key: String(a.name ?? '')
          .toLowerCase()
          .replace(/:$/, '')
          .trim(),
        name: String(a.name ?? '')
          .replace(/:\s*$/, '')
          .trim(),
        isVariation: String(a.is_variation) === '1'
      }))
    // _product_attributes is keyed by the sanitized attribute key; prefer those keys.
    if (attrs && typeof attrs === 'object')
      Object.keys(attrs).forEach((key, i) => {
        if (attributes[i]) attributes[i]!.key = key
      })
    const defaults = tryUnserialize(m._default_attributes)
    const variants = (variationsByParent.get(id) ?? [])
      .map(toVariant)
      .sort((a, b) => a.menuOrder - b.menuOrder || a.wpId - b.wpId)
    return {
      wpId: id,
      status: p.post_status!,
      title: decodeEntities(p.post_title ?? ''),
      slug: p.post_name || `product-${id}`,
      content: p.post_content ?? '',
      excerpt: p.post_excerpt ?? '',
      date: p.post_date!,
      brand: str(m.brand),
      nutritionalInfo: str(m.nutritional_info),
      feedingInstructions: str(m.feeding_instructions),
      ingredientsAndUse: str(m['ingredients-use-instructions']),
      additionalDescriptions: str(m.additional_descriptions),
      thumbnailId: int(m._thumbnail_id),
      galleryIds: (m._product_image_gallery ?? '')
        .split(',')
        .map((x) => Number(x))
        .filter((x) => x > 0),
      attributes,
      defaultAttributes:
        defaults && typeof defaults === 'object'
          ? Object.fromEntries(
              Object.entries(defaults).map(([k, v]) => [k, decodeEntities(String(v))])
            )
          : {},
      categoryIds: termsOf(id, 'product_cat').map((x) => x.termId),
      primaryCategoryId: int(m._yoast_wpseo_primary_product_cat),
      tags: termsOf(id, 'product_tag').map((x) => decodeEntities(x.name)),
      featured: termsOf(id, 'product_visibility').some((x) => x.slug === 'featured'),
      seo: seoOf(m),
      variants
    }
  })

// ---------- pages + home ----------
const pageRows = posts.filter((p) => p.post_type === 'page' && p.post_status === 'publish')
const pages: WpPage[] = pageRows.map((p) => {
  const id = Number(p.ID)
  const m = meta(id)
  return {
    wpId: id,
    title: decodeEntities(p.post_title ?? ''),
    slug: p.post_name!,
    content: p.post_content ?? '',
    date: p.post_date!,
    thumbnailId: int(m._thumbnail_id),
    seo: seoOf(m)
  }
})

const homeRow = pageRows.find((p) => p.post_name === 'home-page')
if (!homeRow) throw new Error('Home page (post_name home-page) not found')
const homeMeta = meta(Number(homeRow.ID))
const slideCount = Number(homeMeta.hero_content_hero_slide ?? 0)
const slides: WpHeroSlide[] = Array.from({ length: slideCount }, (_, i) => {
  const k = (f: string) => homeMeta[`hero_content_hero_slide_${i}_hero_${f}`] ?? ''
  return {
    imageId: int(k('img')),
    title: decodeEntities(k('title')),
    text: decodeEntities(k('text')),
    buttonText: k('button_text'),
    link: k('link'),
    textPosition: k('text_position') === 'right' ? 'right' : 'left',
    textBackground: k('text_background') !== 'false'
  }
})

// ---------- menus ----------
const menus: Record<string, WpMenuItem[]> = {}
for (const p of posts) {
  if (p.post_type !== 'nav_menu_item' || p.post_status !== 'publish') continue
  const id = Number(p.ID)
  const m = meta(id)
  const menu = termsOf(id, 'nav_menu')[0]?.name ?? 'Unknown'
  menus[menu] ??= []
  menus[menu].push({
    label: decodeEntities(p.post_title ?? ''),
    url: m._menu_item_url ?? '',
    order: Number(p.menu_order ?? 0),
    target: m._menu_item_target ?? ''
  })
}
for (const items of Object.values(menus)) items.sort((a, b) => a.order - b.order)

// ---------- customers (P5 only, never sent to Sanity) ----------
const userMeta = new Map<number, Record<string, string | null>>()
for (const r of tables[t('usermeta')]!) {
  const id = Number(r.user_id)
  const m = group(userMeta, id, () => ({}) as Record<string, string | null>)
  m[r.meta_key!] = r.meta_value ?? null
}
const customers: WpCustomer[] = tables[t('users')]!.map((u) => {
  const id = Number(u.ID)
  const m = userMeta.get(id) ?? {}
  const petCount = Number(m.pets_info ?? 0)
  const shipping: Record<string, string> = {}
  for (const [k, v] of Object.entries(m))
    if (k.startsWith('shipping_') && v) shipping[k.slice(9)] = v
  return {
    wpId: id,
    email: (u.user_email ?? '').toLowerCase(),
    firstName: str(m.first_name),
    lastName: str(m.last_name),
    registered: u.user_registered ?? '',
    phone: str(m.billing_phone),
    shipping,
    pets: Array.from({ length: petCount }, (_, i) => ({
      name: str(m[`pets_info_${i}_name`]),
      breed: str(m[`pets_info_${i}_breed`]),
      dateOfBirth: str(m[`pets_info_${i}_date_of_birth`])
    }))
  }
})

// ---------- assert + write ----------
const counts = {
  products: products.filter((p) => p.status === 'publish').length,
  variants: products
    .filter((p) => p.status === 'publish')
    .reduce((n, p) => n + p.variants.length, 0),
  categories: categories.length,
  brands: brands.length,
  pages: pages.length,
  featured: products.filter((p) => p.status === 'publish' && p.featured).length
}
console.table(
  Object.entries(counts).map(([k, v]) => ({
    entity: k,
    found: v,
    expected: EXPECTED[k as keyof typeof EXPECTED]
  }))
)
const drift = Object.entries(EXPECTED).filter(([k, v]) => counts[k as keyof typeof counts] !== v)
if (drift.length && !argFlag('allow-drift')) {
  console.error(
    `Count drift: ${drift.map(([k]) => k).join(', ')}. Re-run with --allow-drift to continue.`
  )
  process.exit(1)
}

const dump: WpDump = {
  extractedAt: new Date().toISOString(),
  products,
  categories,
  brands,
  attachments,
  pages,
  home: { wpId: Number(homeRow.ID), slides, seo: seoOf(homeMeta) },
  menus
}
mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(join(OUT_DIR, 'wp.json'), JSON.stringify(dump, null, 1))
writeFileSync(join(OUT_DIR, 'customers.json'), JSON.stringify(customers, null, 1))
console.log(`Wrote out/wp.json and out/customers.json (${customers.length} users)`)

function decodeEntities(s: string) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&#0?39;/g, "'")
    .replace(/&#8217;|&rsquo;/g, '’')
    .replace(/&#8216;|&lsquo;/g, '‘')
    .replace(/&quot;|&#8220;|&#8221;/g, '"')
    .replace(/&#8211;|&ndash;/g, '–')
    .replace(/&#8212;|&mdash;/g, '—')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
}
