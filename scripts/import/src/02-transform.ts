/**
 * Step 3 of the plan (§3): out/wp.json → out/documents.json (+ out/warnings.json).
 *
 *   bun run transform
 *
 * Pure and offline: no Sanity or network access. Images are left as `_wpImage` placeholders and
 * references as `legacy:<type>:<key>`; 03-load resolves both.
 */
import { randomUUID } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { OUT_DIR } from './lib/env'
import { htmlToPlainText, htmlToRich, textToSimple, type Warning } from './lib/html'
import { brandKey, ref } from './lib/refs'
import type { WpAttachment, WpDump, WpProduct, WpVariant } from './lib/wp'

type Doc = Record<string, any> & { _type: string; _legacyKey?: string; _id?: string }

const wp: WpDump = JSON.parse(readFileSync(join(OUT_DIR, 'wp.json'), 'utf8'))
const warnings: Warning[] = []
const warn = (where: string, message: string) => warnings.push({ where, message })
const importedAt = new Date().toISOString()
const key = () => randomUUID().replace(/-/g, '').slice(0, 12)
const STORE_MAP_EMBED =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3227.08526055229!2d-115.05681068445038!3d36.018211319023706!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80c8d19b15fb659d%3A0xd8f1ad3a9ba38e5d!2sDog+Food+2+My+Door!5e0!3m2!1sen!2sus!4v1516563493149'

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 96)

const collapse = (s: string) => s.replace(/\s+/g, ' ').trim()

function image(
  attachmentId: number | null | undefined,
  where: string,
  extra: Record<string, unknown> = {}
) {
  if (!attachmentId) return undefined
  const a: WpAttachment | undefined = wp.attachments[attachmentId]
  if (!a) {
    warn(where, `attachment ${attachmentId} not found`)
    return undefined
  }
  if (!a.mime.startsWith('image/')) {
    warn(where, `attachment ${attachmentId} is ${a.mime}, not an image`)
    return undefined
  }
  return {
    _type: 'image',
    ...extra,
    ...(a.alt ? { alt: a.alt } : {}),
    _wpImage: { attachmentId, file: a.file, src: a.url }
  }
}

// ------------------------------------------------------------------ brands
const brandDocs = new Map<string, Doc>()
for (const b of wp.brands) {
  const k = brandKey(b.value)
  if (brandDocs.has(k)) continue
  brandDocs.set(k, {
    _type: 'brand',
    _legacyKey: `brand:${k}`,
    title: b.label,
    slug: { _type: 'slug', current: slugify(b.label) },
    featured: false,
    legacy: { acfValue: b.value, importedAt }
  })
}
const brandFor = (p: WpProduct) => {
  if (!p.brand) return undefined
  const k = brandKey(p.brand)
  if (!brandDocs.has(k)) {
    warn(`product ${p.wpId}`, `brand "${p.brand}" is not an ACF choice; created it`)
    brandDocs.set(k, {
      _type: 'brand',
      _legacyKey: `brand:${k}`,
      title: p.brand,
      slug: { _type: 'slug', current: slugify(p.brand) },
      featured: false,
      legacy: { acfValue: p.brand, importedAt }
    })
  }
  return ref('brand', k)
}

// ------------------------------------------------------------------ categories
const categoryIds = new Set(wp.categories.map((c) => c.termId))
const categoryDocs: Doc[] = [...wp.categories]
  // parents first, so a fresh import never references a document created later in the batch
  .sort((a, b) => Number(!!a.parent) - Number(!!b.parent) || a.order - b.order)
  .map((c) => ({
    _type: 'category',
    _legacyKey: `category:${c.termId}`,
    title: c.name,
    slug: { _type: 'slug', current: c.slug },
    ...(c.parent && categoryIds.has(c.parent) ? { parent: ref('category', c.parent) } : {}),
    order: c.order,
    ...(c.description ? { description: htmlToPlainText(c.description) } : {}),
    ...(image(c.thumbnailId, `category ${c.termId}`)
      ? { image: image(c.thumbnailId, `category ${c.termId}`) }
      : {}),
    showInNav: c.slug !== 'uncategorized',
    legacy: { termId: c.termId, wpSlug: c.slug, importedAt }
  }))

// ------------------------------------------------------------------ products
const OPTION_NAMES: Record<string, string> = {
  size: 'Size',
  flavor: 'Flavor',
  flavors: 'Flavor',
  color: 'Color'
}

function variantDoc(p: WpProduct, v: WpVariant, attrKey: string): Doc {
  const where = `product ${p.wpId} variant ${v.wpId}`
  let option = collapse(v.attributes[attrKey] ?? Object.values(v.attributes)[0] ?? '')
  if (!option) {
    warn(where, 'variant has no option value (WooCommerce "any"); labelled "Default"')
    option = 'Default'
  }
  const price = v.price ?? v.regularPrice
  if (price == null || price <= 0) warn(where, `no price (${price})`)
  const onSale = v.salePrice != null && v.regularPrice != null && v.regularPrice > v.salePrice
  const dims = { l: v.length, w: v.width, h: v.height }
  const img = image(v.thumbnailId, where)
  return {
    _key: `v${v.wpId}`,
    _type: 'variant',
    option,
    ...(v.sku ? { sku: v.sku.trim() } : {}),
    ...(price != null && price > 0 ? { price: Math.round(price * 100) / 100 } : {}),
    ...(onSale ? { compareAtPrice: v.regularPrice } : {}),
    inStock: v.stockStatus !== 'outofstock',
    ...(v.manageStock && v.stock != null ? { stockQty: v.stock } : {}),
    ...(v.weight != null ? { weightLbs: v.weight } : {}),
    ...(Object.values(dims).some((x) => x != null)
      ? { dimensionsIn: Object.fromEntries(Object.entries(dims).filter(([, x]) => x != null)) }
      : {}),
    ...(img ? { image: img } : {}),
    ...(v.description ? { note: htmlToPlainText(v.description) } : {})
  }
}

const productDocs: Doc[] = wp.products.map((p) => {
  const where = `product ${p.wpId}`
  const attr = p.attributes.find((a) => a.isVariation) ?? p.attributes[0]
  const attrKey = attr?.key ?? Object.keys(p.variants[0]?.attributes ?? {})[0] ?? 'size'
  const all = p.variants.map((v) => variantDoc(p, v, attrKey))
  const priced = all.some((v) => typeof v.price === 'number')
  // An unpriced size can't be sold; drop it unless it's all the product has (then import as draft)
  const variants = priced
    ? all.filter((v) => {
        if (typeof v.price === 'number') return true
        warn(`${where} variant ${v._key}`, 'unpriced variant dropped')
        return false
      })
    : all
  const defaultOption = p.defaultAttributes[attrKey]
  const defaultVariant = defaultOption
    ? variants.find((v) => v.option === collapse(defaultOption))
    : undefined
  if (defaultOption && !defaultVariant)
    warn(where, `default option "${defaultOption}" matches no variant`)

  const categories = p.categoryIds.filter((id) => categoryIds.has(id))
  if (!categories.length) warn(where, 'no categories')
  const primary =
    p.primaryCategoryId && categories.includes(p.primaryCategoryId)
      ? p.primaryCategoryId
      : // deepest category is the most specific breadcrumb
        (categories.find((id) => wp.categories.find((c) => c.termId === id)?.parent) ??
        categories[0])
  if (!p.brand) warn(where, 'no brand')
  const mainImage = image(p.thumbnailId, where)
  if (!mainImage) warn(where, 'no main image')

  return {
    _type: 'product',
    _legacyKey: `product:${p.wpId}`,
    title: collapse(p.title),
    slug: { _type: 'slug', current: p.slug },
    status: p.status === 'publish' && priced ? 'active' : 'draft',
    ...(brandFor(p) ? { brand: brandFor(p) } : {}),
    categories: categories.map((id) => ref('category', id, { _key: `c${id}` })),
    ...(primary ? { primaryCategory: ref('category', primary) } : {}),
    featured: p.featured,
    ...(mainImage ? { mainImage } : {}),
    ...(p.galleryIds.length
      ? {
          gallery: p.galleryIds.map((id) => image(id, where, { _key: `g${id}` })).filter(Boolean)
        }
      : {}),
    ...(p.excerpt ? { shortDescription: htmlToPlainText(p.excerpt) } : {}),
    description: htmlToRich(p.content, `${where} description`, warnings),
    nutritionalInfo: htmlToRich(p.nutritionalInfo, `${where} nutritionalInfo`, warnings),
    feedingInstructions: htmlToRich(
      p.feedingInstructions,
      `${where} feedingInstructions`,
      warnings
    ),
    ingredientsAndUse: htmlToRich(p.ingredientsAndUse, `${where} ingredientsAndUse`, warnings),
    showAdditionalInfo: p.additionalDescriptions !== 'No',
    optionName: OPTION_NAMES[attrKey.toLowerCase()] ?? attr?.name ?? 'Size',
    variants,
    ...(defaultVariant ? { defaultVariantKey: defaultVariant._key } : {}),
    autoshipEligible: true,
    ...(p.tags.length ? { tags: p.tags } : {}),
    ...(p.seo.title || p.seo.description ? { seo: { _type: 'meta', ...p.seo } } : {}),
    legacy: { wpId: p.wpId, wpSlug: p.slug, importedAt }
  }
})

// ------------------------------------------------------------------ pages
const padding = { _type: 'section-padding', top: 'md', bottom: 'md' }
const linkTo = (title: string, href: string) => ({
  _type: 'link',
  title,
  linkType: 'href',
  href: href.replace(/\/$/, '') || '/',
  target: false,
  buttonVariant: 'default'
})

const pageDocs: Doc[] = wp.pages
  .filter((p) => p.wpId !== wp.home.wpId)
  .map((p) => {
    const where = `page ${p.wpId} (${p.slug})`
    const content = htmlToRich(p.content, where, warnings)
    const blocks =
      p.slug === 'reviews' && !content.length
        ? [
            {
              _type: 'reviews-embed',
              _key: key(),
              heading: p.title,
              provider: 'manual',
              reviews: [],
              padding
            }
          ]
        : [
            {
              _type: 'rich-content-block',
              _key: key(),
              title: p.title,
              content,
              backgroundColor: 'white',
              textAlign: 'left',
              showLink: false,
              padding
            }
          ]
    if (!content.length && p.slug !== 'reviews') warn(where, 'page has no content')
    return {
      _type: 'page',
      _legacyKey: `page:${p.wpId}`,
      title: p.title,
      slug: { _type: 'slug', current: p.slug },
      blocks,
      ...(p.seo.title || p.seo.description ? { meta: { _type: 'meta', ...p.seo } } : {}),
      legacy: { wpId: p.wpId, wpSlug: p.slug, importedAt }
    }
  })

// Home: ACF hero slider + the page's own WPBakery content + featured products + contact
const homeWp = wp.pages.find((p) => p.wpId === wp.home.wpId)
const homeContent = htmlToRich(homeWp?.content, 'home content', warnings)
const homeDoc: Doc = {
  _id: 'homePage',
  _type: 'homePage',
  blocks: [
    {
      _type: 'hero-slider',
      _key: key(),
      autoplay: true,
      intervalMs: 6000,
      padding: { _type: 'section-padding', top: 'none', bottom: 'none' },
      slides: wp.home.slides.map((s, i) => ({
        _type: 'slide',
        _key: key(),
        ...(image(s.imageId, `home slide ${i}`)
          ? { image: image(s.imageId, `home slide ${i}`) }
          : {}),
        ...(s.title ? { title: s.title } : {}),
        text: textToSimple(s.text),
        buttonText: s.buttonText || 'Shop Now!',
        ...(s.link ? { link: linkTo(s.buttonText || 'Shop Now!', s.link) } : {}),
        textPosition: s.textPosition,
        textBackground: s.textBackground
      }))
    },
    {
      _type: 'product-grid',
      _key: key(),
      heading: 'Best Sellers',
      viewAllLink: { ...linkTo('View All', '/shop'), buttonVariant: 'link' },
      source: 'featured',
      limit: 16,
      layout: 'carousel',
      padding
    },
    ...(homeContent.length
      ? [
          {
            _type: 'rich-content-block',
            _key: key(),
            content: homeContent,
            backgroundColor: 'white',
            textAlign: 'left',
            showLink: false,
            padding
          }
        ]
      : []),
    {
      _type: 'contact-map',
      _key: key(),
      mapEmbedUrl: STORE_MAP_EMBED,
      padding: { _type: 'section-padding', top: 'none', bottom: 'none' }
    },
    {
      _type: 'cta-banner',
      _key: key(),
      size: 'band',
      decoration: 'badge',
      background: 'sky-band',
      text: textToSimple(
        'Sign up today and receive 20% off, when you set your automatic shipment!'
      ),
      button: linkTo('Sign Up', '/account'),
      padding: { _type: 'section-padding', top: 'none', bottom: 'none' }
    }
  ],
  ...(wp.home.seo.title || wp.home.seo.description
    ? { meta: { _type: 'meta', ...wp.home.seo } }
    : {})
}

// ------------------------------------------------------------------ site settings
// Mirrors the pre-maintenance header/footer (see docs/design/OLD-APP-SPEC.md §2 and the
// screenshots): WordPress only had a 4-item menu, the category bar and footer lived in React.
const categoryLink = (label: string, slug: string) => {
  const c = wp.categories.find((x) => x.slug === slug)
  if (!c) {
    warn('site settings', `category "${slug}" not found for the menu`)
    return linkTo(label, `/shop/category/${slug}`)
  }
  return {
    ...linkTo(label, ''),
    linkType: 'internal',
    href: undefined,
    internal: ref('category', c.termId)
  }
}
const pageLink = (label: string, slug: string) => {
  const pg = wp.pages.find((x) => x.slug === slug)
  if (!pg) return linkTo(label, `/${slug}`)
  return {
    ...linkTo(label, ''),
    linkType: 'internal',
    href: undefined,
    internal: ref('page', pg.wpId)
  }
}
const menuLink = (label: string, link: Record<string, unknown>) => ({
  _type: 'menuLink',
  _key: key(),
  label,
  link
})
const navItem = (label: string, link: Record<string, unknown>, dropdown = 'none') => ({
  _type: 'navItem',
  _key: key(),
  label,
  link,
  dropdown
})

const settingsDoc: Doc = {
  _id: 'siteSettings',
  _type: 'siteSettings',
  mainMenu: [
    navItem('Shop by Brand', linkTo('Shop by Brand', '/shop'), 'brands'),
    navItem('Accessories', categoryLink('Accessories', 'home-accessories')),
    navItem('Food', categoryLink('Food', 'dog-food'), 'children'),
    navItem('Kitty Corner', categoryLink('Kitty Corner', 'cat')),
    navItem('Toys', categoryLink('Toys', 'toys')),
    navItem('Treats', categoryLink('Treats', 'treats'))
  ],
  footerColumns: [
    {
      _type: 'footerColumn',
      _key: key(),
      title: 'Shop',
      links: [
        menuLink('Shop by Brand', linkTo('Shop by Brand', '/shop')),
        menuLink('Weekly Deals', pageLink('Weekly Deals', 'weekly-deals'))
      ]
    },
    {
      _type: 'footerColumn',
      _key: key(),
      title: 'Account',
      links: [
        menuLink('Orders', linkTo('Orders', '/account/orders')),
        menuLink('My Account', linkTo('My Account', '/account'))
      ]
    },
    {
      _type: 'footerColumn',
      _key: key(),
      title: 'About',
      links: [
        menuLink('About Us', pageLink('About Us', 'about')),
        menuLink('FAQ', pageLink('FAQ', 'faq'))
      ]
    }
  ],
  legalLinks: [
    menuLink('Privacy Policy', pageLink('Privacy Policy', 'privacy-policy')),
    menuLink('Return Policy', pageLink('Return Policy', 'return-policy'))
  ],
  social: {
    instagram: 'https://www.instagram.com/dogfood2mydoor/',
    facebook: 'https://www.facebook.com/dogfood2mydoor/'
  },
  announcement: {
    active: true,
    text: textToSimple('SAVE 20% TODAY- First Time Auto Ship.'),
    button: { ...linkTo('Get Started!', '/shop'), buttonVariant: 'dark' }
  },
  contact: {
    phone: '702-971-2484',
    email: 'info@dogfood2mydoor.com',
    address: '1550 W. Horizon Ridge Pkwy, Suite N\nHenderson, NV 89012'
  },
  delivery: {
    allowTimeRequest: true,
    timeWindow: { start: '08:00', end: '18:00', slotMinutes: 30 },
    pickupEnabled: true,
    pickupNote: 'Your items will be available for pick up in 1 hour or less.',
    noDeliveryDays: [],
    holidays: [],
    // The old checkout zip dropdown (plus "Other"); zip checks are on hold
    zipCodes: ['89141', '89044', '89052', '89012', '89074', '89014', '89015', '89002'],
    areaLabel: 'Henderson, Las Vegas and Boulder City'
  },
  autoship: { firstOrderDiscountPercent: 20, reminderDaysBefore: 3 },
  taxRatePercent: 8.25
}

// ------------------------------------------------------------------ write
const documents: Doc[] = [
  ...brandDocs.values(),
  ...categoryDocs,
  ...productDocs,
  ...pageDocs,
  homeDoc,
  settingsDoc
]
writeFileSync(join(OUT_DIR, 'documents.json'), JSON.stringify(documents))
writeFileSync(join(OUT_DIR, 'warnings.json'), JSON.stringify(warnings, null, 1))

const count = (t: string) => documents.filter((d) => d._type === t).length
console.table({
  brand: count('brand'),
  category: count('category'),
  product: count('product'),
  'product (active)': productDocs.filter((d) => d.status === 'active').length,
  variant: productDocs.reduce((n, d) => n + d.variants.length, 0),
  table: productDocs.reduce(
    (n, d) =>
      n +
      ['nutritionalInfo', 'feedingInstructions', 'ingredientsAndUse', 'description']
        .flatMap((f) => d[f] ?? [])
        .filter((b: Doc) => b._type === 'table').length,
    0
  ),
  page: count('page'),
  warnings: warnings.length
})
const byMessage = new Map<string, number>()
for (const w of warnings) {
  const m = w.message.replace(/\d+/g, '#').replace(/"[^"]*"/g, '"…"')
  byMessage.set(m, (byMessage.get(m) ?? 0) + 1)
}
console.log('Warnings by kind:')
for (const [m, n] of [...byMessage].sort((a, b) => b[1] - a[1])) console.log(`  ${n}× ${m}`)
