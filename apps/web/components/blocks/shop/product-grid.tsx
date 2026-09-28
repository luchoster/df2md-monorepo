import Link from 'next/link'
import { stegaClean } from 'next-sanity'
import { ProductCard } from '@/components/catalog/product-card'
import { ProductCarousel } from '@/components/catalog/product-carousel'
import type { CardProduct } from '@/components/catalog/types'
import { hrefFor } from '@/lib/links'
import { Section } from '../section'
import type { BlockOf } from '../types'

export default function ProductGrid({
  heading,
  viewAllLink,
  products,
  limit,
  layout,
  source,
  padding
}: BlockOf<'product-grid'>) {
  const list = ((products ?? []) as CardProduct[]).filter((p) => p?.variants?.length)
  const shown = stegaClean(source) === 'manual' ? list : list.slice(0, limit ?? 12)
  if (!shown.length) return null
  const viewAll = hrefFor(viewAllLink)
  return (
    <Section padding={padding} className="overflow-x-hidden">
      <div className="px-4 md:px-6">
        {heading && (
          <div className="flex flex-wrap items-baseline gap-x-5">
            <h2 className="mb-0 text-[32px] md:text-[40px]">{heading}</h2>
            {viewAll && (
              <Link href={viewAll} className="text-xl font-normal text-link hover:underline">
                {viewAllLink?.title || 'View All'}
              </Link>
            )}
          </div>
        )}
        {stegaClean(layout) === 'carousel' ? (
          <ProductCarousel products={shown} />
        ) : (
          <ul className="mt-8 grid gap-y-10 md:grid-cols-2 md:gap-x-5 xl:grid-cols-3">
            {shown.map((p) => (
              <li key={p._id}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Section>
  )
}
