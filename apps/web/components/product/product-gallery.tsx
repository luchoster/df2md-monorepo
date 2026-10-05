'use client'

import { SanityImage, type SanityImageValue } from '@/components/sanity-image'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel'

/**
 * From shadcnblocks Product Detail 1: a swipeable carousel on phones, a grid (lead image full
 * width, the rest in thirds) from 768px. Product shots are contained on white, not cropped.
 */
export function ProductGallery({ images, title }: { images: SanityImageValue[]; title: string }) {
  const list = images.filter((i) => i?.asset)
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
    <Carousel opts={{ breakpoints: { '(min-width: 768px)': { active: false } } }}>
      <CarouselContent className="gap-4 md:m-0 md:grid md:grid-cols-3 xl:gap-5">
        {list.map((img, i) => (
          <CarouselItem className="first:col-span-3 md:p-0" key={img?.asset?._id ?? i}>
            <AspectRatio ratio={1} className="overflow-hidden rounded-xl border bg-white">
              <SanityImage
                image={img}
                alt={img?.alt ?? (i === 0 ? title : `${title} – image ${i + 1}`)}
                fill
                priority={i === 0}
                sizes={
                  i === 0 ? '(min-width: 1024px) 45vw, 100vw' : '(min-width: 1024px) 15vw, 100vw'
                }
                className="!object-contain p-6"
              />
            </AspectRatio>
          </CarouselItem>
        ))}
      </CarouselContent>
      {list.length > 1 && (
        <div className="md:hidden">
          <CarouselPrevious className="left-4" />
          <CarouselNext className="right-4" />
        </div>
      )}
    </Carousel>
  )
}
