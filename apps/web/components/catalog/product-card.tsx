import Link from 'next/link'
import { SanityImage } from '@/components/sanity-image'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'
import { QuickAddDrawer, QuickAddPanel } from './quick-add'
import type { CardProduct } from './types'

/**
 * shadcnblocks Product Card 4 (brand, title, price on a soft card) with Product Card 7's quick
 * add (hover size panel on desktop, drawer on mobile).
 */
export function ProductCard({ product, className }: { product: CardProduct; className?: string }) {
  const href = `/shop/${product.slug}`
  const variants = product.variants ?? []
  const inStock = variants.filter((v) => v.inStock !== false)
  const prices = (inStock.length ? inStock : variants).map((v) => v.price ?? 0).filter((p) => p > 0)
  const min = prices.length ? Math.min(...prices) : 0
  const cheapest = variants.find((v) => v.price === min)
  const onSale = cheapest?.compareAtPrice != null && cheapest.compareAtPrice > min
  const soldOut = variants.length > 0 && !inStock.length

  return (
    <article
      className={cn(
        'group flex h-full flex-col gap-2 rounded-lg bg-card p-1.5 text-left',
        className
      )}
    >
      <div className="relative overflow-hidden rounded-lg border bg-white">
        <Link href={href} className="block aspect-square" tabIndex={-1} aria-hidden>
          {product.mainImage?.asset ? (
            <SanityImage
              image={product.mainImage}
              alt=""
              fill
              sizes="(min-width: 1280px) 16vw, (min-width: 768px) 25vw, 50vw"
              className="!object-contain p-3 transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <span className="grid h-full place-items-center text-sm text-muted-foreground">
              No image
            </span>
          )}
        </Link>
        {onSale && (
          <span className="absolute top-2 left-2 rounded-full bg-sale px-2 py-0.5 text-xs font-bold text-white">
            Sale
          </span>
        )}
        {soldOut && (
          <span className="absolute top-2 left-2 rounded-full bg-foreground/80 px-2 py-0.5 text-xs font-bold text-white">
            Out of stock
          </span>
        )}
        {!soldOut && <QuickAddPanel product={product} />}
      </div>
      <div className="flex flex-1 items-start justify-between gap-2 px-1 pb-1">
        <Link
          href={href}
          className="flex min-w-0 flex-1 flex-col gap-1 no-underline hover:no-underline"
        >
          {product.brand && (
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {product.brand}
            </span>
          )}
          <h3 className="line-clamp-2 text-sm leading-snug font-semibold text-foreground group-hover:text-primary">
            {product.title}
          </h3>
          <span className="mt-0.5 flex items-baseline gap-1.5 text-sm">
            {prices.length > 1 && new Set(prices).size > 1 && (
              <span className="text-xs text-muted-foreground">from</span>
            )}
            <span className={cn('font-bold', onSale ? 'text-sale' : 'text-foreground')}>
              {formatPrice(min)}
            </span>
            {onSale && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(cheapest?.compareAtPrice ?? 0)}
              </span>
            )}
          </span>
        </Link>
        {!soldOut && <QuickAddDrawer product={product} />}
      </div>
    </article>
  )
}
