import Link from 'next/link'
import type { Product } from './types'

/** The "Product Details" spec list from shadcnblocks Product Detail 1, filled from Sanity. */
export function ProductSpecs({ product }: { product: Product }) {
  const category = product.primaryCategory ?? product.categories?.[0]
  const sizes = (product.variants ?? []).map((v) => v.option).filter(Boolean)
  const rows: { label: string; value: React.ReactNode }[] = [
    product.brand?.title && {
      label: 'Brand',
      value: (
        <Link href={`/shop?brand=${product.brand.slug}`} className="text-link hover:underline">
          {product.brand.title}
        </Link>
      )
    },
    category?.title && {
      label: 'Category',
      value: (
        <Link href={`/shop/category/${category.slug}`} className="text-link hover:underline">
          {category.title}
        </Link>
      )
    },
    sizes.length > 0 && {
      label: product.optionName === 'Flavor' ? 'Flavors' : 'Sizes',
      value: sizes.join(' · ')
    },
    { label: 'Delivery', value: 'Free next-day delivery, no minimum' },
    product.autoshipEligible !== false && {
      label: 'Autoship',
      value: 'Available · 20% off your first order'
    }
  ].filter(Boolean) as { label: string; value: React.ReactNode }[]

  return (
    <div>
      <h2 className="mb-2 text-lg">Product Details</h2>
      <dl>
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-6 border-b py-3 last:border-b-0"
          >
            <dt className="text-sm font-medium text-muted-foreground">{row.label}</dt>
            <dd className="text-right text-sm font-medium text-foreground">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
