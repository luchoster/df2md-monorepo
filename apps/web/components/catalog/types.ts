import type { SanityImageValue } from '@/components/sanity-image'

/** Matches sanity/queries/shared/product-card.ts */
export type CardVariant = {
  _key: string
  option: string | null
  price: number | null
  compareAtPrice: number | null
  inStock: boolean | null
}

export type CardProduct = {
  _id: string
  title: string | null
  slug: string | null
  brand: string | null
  mainImage: SanityImageValue
  optionName: string | null
  defaultVariantKey: string | null
  autoshipEligible: boolean | null
  noDiscounts?: boolean | null
  variants: CardVariant[] | null
}
