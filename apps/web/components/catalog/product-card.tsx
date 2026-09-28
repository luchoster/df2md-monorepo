import Link from 'next/link'
import { SanityImage } from '@/components/sanity-image'
import type { CardProduct } from './types'
import { VariantPicker } from './variant-picker'

/** single-product.js: image, one-line name, brand, then the price/size/Autoship widget. */
export function ProductCard({
  product,
  imageClassName = 'h-[200px]'
}: {
  product: CardProduct
  imageClassName?: string
}) {
  const href = `/shop/${product.slug}`
  return (
    <article className="flex h-full flex-col items-center px-2.5 text-center">
      <Link href={href} className="group block w-full text-ink-900 no-underline hover:no-underline">
        <div
          className={`relative mx-auto flex w-full items-center justify-center ${imageClassName}`}
        >
          {product.mainImage?.asset ? (
            <SanityImage
              image={product.mainImage}
              alt={product.title ?? ''}
              sizes="(min-width: 1280px) 20vw, (min-width: 768px) 33vw, 80vw"
              className="h-full w-auto max-w-full object-contain"
            />
          ) : (
            <div className="grid h-full w-full place-items-center rounded bg-footer text-sm text-muted">
              No image
            </div>
          )}
        </div>
        {product.brand && (
          <p className="mt-4 mb-0 text-sm uppercase tracking-wide text-body">{product.brand}</p>
        )}
        <h3
          className="mx-auto mt-1 mb-2 w-[90%] truncate text-base leading-10 font-semibold text-ink-900 group-hover:text-navy md:text-lg"
          title={product.title ?? undefined}
        >
          {product.title}
        </h3>
      </Link>
      <div className="mt-auto w-full">
        <VariantPicker product={product} />
      </div>
    </article>
  )
}
