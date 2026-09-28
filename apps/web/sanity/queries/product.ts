import { defineQuery } from 'next-sanity'
import { bodyFragment } from './shared/body'
import { imageFragment } from './shared/image'
import { metaFragment } from './shared/meta'
import { productCardFragment } from './shared/product-card'

export const PRODUCT_QUERY = defineQuery(`
  *[_type == "product" && slug.current == $slug && status != "archived"][0]{
    _id, title, "slug": slug.current, status, featured, shortDescription,
    "brand": brand->{ title, "slug": slug.current },
    "categories": categories[]->{ _id, title, "slug": slug.current, "parent": parent->{ title, "slug": slug.current } },
    "primaryCategory": primaryCategory->{ title, "slug": slug.current, "parent": parent->{ title, "slug": slug.current } },
    mainImage { ${imageFragment} },
    gallery[]{ _key, ${imageFragment} },
    optionName, defaultVariantKey, autoshipEligible, showAdditionalInfo, tags,
    "variants": variants[price > 0]{ _key, option, sku, price, compareAtPrice, inStock, weightLbs,
      image { ${imageFragment} } },
    description[]{ ${bodyFragment} },
    nutritionalInfo[]{ ${bodyFragment} },
    feedingInstructions[]{ ${bodyFragment} },
    ingredientsAndUse[]{ ${bodyFragment} },
    seo { ${metaFragment} },
    "related": *[_type == "product" && status == "active" && _id != ^._id
      && count((categories[]._ref)[@ in ^.^.categories[]._ref]) > 0
      && count(variants[price > 0]) > 0] | order(featured desc, lower(title) asc)[0...10]{ ${productCardFragment} }
  }
`)

export const PRODUCT_SLUGS_QUERY = defineQuery(`
  *[_type == "product" && status == "active" && defined(slug.current)]{ "slug": slug.current }
`)
