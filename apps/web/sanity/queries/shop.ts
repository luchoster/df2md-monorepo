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

/** GROQ slices can't take params, so the page window is interpolated (validated integers only). */
export function shopProductsQuery(page: number) {
  const start = (Math.max(1, Math.floor(page)) - 1) * SHOP_PAGE_SIZE
  return `*[${shopFilter}] | order(featured desc, lower(title) asc) [${start}...${start + SHOP_PAGE_SIZE}]{ ${productCardFragment} }`
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
