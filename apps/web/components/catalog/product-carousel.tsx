'use client'

import useEmblaCarousel from 'embla-carousel-react'
import { CarouselArrows, CarouselDots } from '@/components/ui/carousel-controls'
import { useAutoplay, useDots } from '@/components/ui/use-autoplay'
import { ProductCard } from './product-card'
import type { CardProduct } from './types'

/** Best Sellers / related products: 2 → 3 → 4 → 5 cards, autoplay 8s, round arrows, pill dots. */
export function ProductCarousel({ products }: { products: CardProduct[] }) {
  const [ref, api] = useEmblaCarousel({ loop: true, align: 'start', slidesToScroll: 1 })
  useAutoplay(api, 8000)
  const { selected, count } = useDots(api)

  return (
    <div className="relative mt-8">
      <div ref={ref} className="-mx-1.5 overflow-hidden">
        <div className="flex">
          {products.map((p) => (
            <div
              key={p._id}
              className="min-w-0 shrink-0 grow-0 basis-1/2 px-1.5 md:basis-1/3 lg:basis-1/4 min-[1281px]:basis-1/5"
            >
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
      <CarouselArrows
        api={api}
        label="products"
        className="top-[calc(50%-3rem)] -mx-3 hidden -translate-y-1/2 sm:flex md:-mx-5"
      />
      <CarouselDots api={api} selected={selected} count={count} label="product" className="mt-8" />
    </div>
  )
}
