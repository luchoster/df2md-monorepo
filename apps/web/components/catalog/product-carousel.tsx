'use client'

import useEmblaCarousel from 'embla-carousel-react'
import Image from 'next/image'
import { useAutoplay, useDots } from '@/components/ui/use-autoplay'
import { cn } from '@/lib/utils'
import { ProductCard } from './product-card'
import type { CardProduct } from './types'

/**
 * best-sellers-slider.js: 5 / 3 / 2 / 1 cards (>1280 / >1024 / >680 / smaller), 8s autoplay,
 * translucent 40×100 arrows, square sky-blue dots with the active one orange.
 */
export function ProductCarousel({ products }: { products: CardProduct[] }) {
  const [ref, api] = useEmblaCarousel({ loop: true, align: 'center', slidesToScroll: 1 })
  useAutoplay(api, 8000)
  const { selected, count } = useDots(api)

  return (
    <div className="relative my-12">
      <div ref={ref} className="overflow-hidden">
        <div className="flex">
          {products.map((p) => (
            <div
              key={p._id}
              className="min-w-0 shrink-0 grow-0 basis-full min-[681px]:basis-1/2 min-[1025px]:basis-1/3 min-[1281px]:basis-1/5"
            >
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
      {[
        {
          dir: 'prev',
          label: 'Previous products',
          onClick: () => api?.scrollPrev(),
          className: 'left-0 rotate-180'
        },
        {
          dir: 'next',
          label: 'Next products',
          onClick: () => api?.scrollNext(),
          className: 'right-0'
        }
      ].map((b) => (
        <button
          key={b.dir}
          onClick={b.onClick}
          aria-label={b.label}
          className={cn(
            'absolute top-[100px] z-10 hidden h-[100px] w-10 -translate-y-1/2 place-items-center bg-[rgba(96,80,76,0.5)] transition-colors duration-250 hover:bg-[rgba(96,80,76,0.9)] sm:grid',
            b.className
          )}
        >
          <Image
            src="/brand/slider-arrow-right.svg"
            alt=""
            width={16}
            height={32}
            className="h-8 w-auto"
          />
        </button>
      ))}
      {count > 1 && (
        <div className="mt-10 flex justify-center gap-1.5">
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              onClick={() => api?.scrollTo(i)}
              aria-label={`Go to product ${i + 1}`}
              aria-current={i === selected}
              className={cn('size-5', i === selected ? 'bg-orange' : 'bg-sky')}
            />
          ))}
        </div>
      )}
    </div>
  )
}
