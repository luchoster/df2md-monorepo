'use client'

import { useEffect, useState } from 'react'
import { SanityImage, type SanityImageValue } from '@/components/sanity-image'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel'
import { cn } from '@/lib/utils'
import { useVariant } from './variant-context'

const assetId = (img: SanityImageValue | null | undefined) => img?.asset?._id

/**
 * Lead image carousel (swipe on phones, arrows on desktop) with a thumbnail strip. Variant
 * images (one per flavor) follow the product images, and picking a flavor/size brings its
 * image to the front. Product shots are contained on white, not cropped.
 */
export function ProductGallery({ images, title }: { images: SanityImageValue[]; title: string }) {
  const { image: variantImage } = useVariant()
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)

  const list = images.filter(
    (img, i) => img?.asset && images.findIndex((other) => assetId(other) === assetId(img)) === i
  )
  const activeId = assetId(variantImage)
  const activeIndex = activeId ? list.findIndex((img) => assetId(img) === activeId) : -1

  useEffect(() => {
    if (!api) return
    const onSelect = () => setCurrent(api.selectedScrollSnap())
    onSelect()
    api.on('select', onSelect)
    return () => {
      api.off('select', onSelect)
    }
  }, [api])

  useEffect(() => {
    if (api && activeIndex >= 0) api.scrollTo(activeIndex)
  }, [api, activeIndex])

  if (!list.length)
    return (
      <AspectRatio
        ratio={1}
        className="grid place-items-center rounded-xl bg-muted text-muted-foreground"
      >
        No image yet
      </AspectRatio>
    )
  return (
    <div className="space-y-3 lg:sticky lg:top-24 lg:self-start">
      <Carousel setApi={setApi} opts={{ loop: list.length > 1 }}>
        <CarouselContent>
          {list.map((img, i) => (
            <CarouselItem key={assetId(img) ?? i}>
              <AspectRatio ratio={1} className="overflow-hidden rounded-xl border bg-white">
                <SanityImage
                  image={img}
                  alt={img?.alt ?? (i === 0 ? title : `${title} – image ${i + 1}`)}
                  fill
                  priority={i === 0}
                  sizes="(min-width: 1024px) 45vw, 100vw"
                  className="!object-contain p-6"
                />
              </AspectRatio>
            </CarouselItem>
          ))}
        </CarouselContent>
        {list.length > 1 && (
          <>
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
          </>
        )}
      </Carousel>
      {list.length > 1 && (
        <ul className="grid grid-cols-5 gap-2 sm:grid-cols-6">
          {list.map((img, i) => (
            <li key={assetId(img) ?? i}>
              <button
                type="button"
                onClick={() => api?.scrollTo(i)}
                aria-label={`Show image ${i + 1}`}
                aria-current={current === i}
                className={cn(
                  'block w-full overflow-hidden rounded-md border-2 bg-white transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  current === i ? 'border-primary' : 'border-transparent hover:border-border'
                )}
              >
                <AspectRatio ratio={1}>
                  <SanityImage
                    image={img}
                    alt=""
                    fill
                    sizes="80px"
                    className="!object-contain p-1"
                  />
                </AspectRatio>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
