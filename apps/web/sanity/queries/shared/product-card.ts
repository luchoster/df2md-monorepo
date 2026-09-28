import { imageFragment } from './image'

/** What a product card needs (it carries the size picker and Add to Cart, as on the old site). */
export const productCardFragment = /* groq */ `
  _id,
  title,
  "slug": slug.current,
  "brand": brand->title,
  mainImage { ${imageFragment} },
  optionName,
  defaultVariantKey,
  autoshipEligible,
  "variants": variants[price > 0]{ _key, option, price, compareAtPrice, inStock }
`
