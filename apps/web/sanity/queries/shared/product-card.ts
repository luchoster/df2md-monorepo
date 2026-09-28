import { imageFragment } from './image'

/** What a product card needs; used by the shop grid and the product-grid block. */
export const productCardFragment = /* groq */ `
  _id,
  title,
  "slug": slug.current,
  "brand": brand->title,
  featured,
  mainImage { ${imageFragment} },
  "prices": variants[price > 0].price,
  "compareAt": variants[defined(compareAtPrice)].compareAtPrice,
  "inStock": count(variants[inStock != false]) > 0
`
