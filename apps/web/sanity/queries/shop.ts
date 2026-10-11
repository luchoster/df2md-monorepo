import { defineQuery } from 'next-sanity'
import { metaFragment } from './shared/meta'
import { productCardFragment } from './shared/product-card'

export const SHOP_PAGE_SIZE = 12

/**
 * One filter for every listing. Empty params switch a condition off:
 * $brand = brand slug, $cats = category ids (a category plus its children), $q = search term.
 */
const shopFilter = /* groq */ `
  _type == "product" && status == "active" && count(variants[price > 0]) > 0
  && ($brand == "" || brand->slug.current == $brand)
  && (count($cats) == 0 || count((categories[]._ref)[@ in $cats]) > 0)
  && ($q == "" || [title, brand->title] match $q)
`

export const SHOP_COUNT_QUERY = defineQuery(`count(*[${shopFilter}])`)

const minPrice = 'math::min(variants[price > 0].price)'

/** ?sort= values for listings. The first one is the default (left out of URLs). */
export const SHOP_SORTS = {
  featured: { label: 'Featured', order: 'featured desc, lower(title) asc' },
  'name-asc': { label: 'Name: A to Z', order: 'lower(title) asc' },
  'name-desc': { label: 'Name: Z to A', order: 'lower(title) desc' },
  'price-asc': { label: 'Price: low to high', order: `${minPrice} asc, lower(title) asc` },
  'price-desc': { label: 'Price: high to low', order: `${minPrice} desc, lower(title) asc` },
  newest: { label: 'Newest', order: '_createdAt desc' }
} as const

export type ShopSort = keyof typeof SHOP_SORTS

export const parseShopSort = (value: string | undefined): ShopSort =>
  value && value in SHOP_SORTS ? (value as ShopSort) : 'featured'

/**
 * GROQ slices and order() can't take params, so the page window (validated integers) and the
 * sort (a key of SHOP_SORTS, never user text) are interpolated.
 */
export function shopProductsQuery(page: number, sort: ShopSort = 'featured') {
  const start = (Math.max(1, Math.floor(page)) - 1) * SHOP_PAGE_SIZE
  const order = (SHOP_SORTS[sort] ?? SHOP_SORTS.featured).order
  return `*[${shopFilter}] | order(${order}) [${start}...${start + SHOP_PAGE_SIZE}]{ ${productCardFragment} }`
}

export const CATEGORY_BY_SLUG_QUERY = defineQuery(`
  *[_type == "category" && slug.current == $slug][0]{
    _id, title, "slug": slug.current, description, seo { ${metaFragment} },
    "parent": parent->{ title, "slug": slug.current },
    "ids": [_id] + *[_type == "category" && parent._ref == ^._id]._id
  }
`)

export const BRAND_BY_SLUG_QUERY = defineQuery(`
  *[_type == "brand" && slug.current == $slug][0]{ title, "slug": slug.current }
`)

export const CATEGORY_SLUGS_QUERY = defineQuery(
  `*[_type == "category" && defined(slug.current)]{ "slug": slug.current }`
)
