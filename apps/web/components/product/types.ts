import type { PRODUCT_QUERY_RESULT } from '@/sanity.types'

export type Product = NonNullable<PRODUCT_QUERY_RESULT>
export type ProductVariant = NonNullable<Product['variants']>[number]
