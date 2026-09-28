'use client'

import useEmblaCarousel from 'embla-carousel-react'
import { stegaClean } from 'next-sanity'
import { ButtonLink } from '@/components/button-link'
import { PortableTextRenderer } from '@/components/portable-text-renderer'
import { SanityImage } from '@/components/sanity-image'
import { useAutoplay, useDots } from '@/components/ui/use-autoplay'
import { cn } from '@/lib/utils'
import type { BlockOf } from '../types'

/**
 * home_slider.js rebuilt: full-width slides (560 / 250 / 200px), background image, a text box on
 * the left or right half (optional 75% white panel), "Shop Now" button, dots from 768px.
 */
export default function HeroSlider({ slides, autoplay, intervalMs }: BlockOf<'hero-slider'>) {
  const [ref, api] = useEmblaCarousel({ loop: true })
  useAutoplay(api, intervalMs ?? 8000, autoplay !== false && (slides?.length ?? 0) > 1)
  const { selected, count } = useDots(api)
  if (!slides?.length) return null

  return (
    <section aria-roledescription="carousel" aria-label="Highlights" className="relative">
      <div ref={ref} className="overflow-hidden">
        <div className="flex">
          {slides.map((slide, i) => {
            const right = stegaClean(slide.textPosition) === 'right'
            return (
              // biome-ignore lint/a11y/useSemanticElements: WAI-ARIA carousel pattern (group + roledescription "slide")
              <div
                key={slide._key}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${slides.length}`}
                className="relative flex h-[200px] min-w-0 shrink-0 grow-0 basis-full items-center sm:h-[250px] md:h-[560px]"
              >
                {slide.image?.asset ? (
                  <SanityImage image={slide.image} fill priority={i === 0} sizes="100vw" />
                ) : (
                  <div className="absolute inset-0 bg-brand/10" />
                )}
                <div
                  className={cn(
                    'relative flex h-full w-full items-center',
                    right ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-full w-3/5 items-center md:w-1/2',
                      right ? 'justify-start' : 'justify-end',
                      slide.textBackground && 'bg-white/75'
                    )}
                  >
                    <div className="max-w-[600px] p-3 text-ink-900 md:p-5">
                      {slide.title && (
                        <h2 className="mb-2 text-base md:text-[32px]">{slide.title}</h2>
                      )}
                      <PortableTextRenderer
                        value={slide.text as never}
                        className="text-xs leading-snug font-normal md:text-[28px] md:leading-[1.3] [&_p]:mb-2.5 md:[&_p]:mb-4"
                      />
                      {slide.link && (
                        <ButtonLink link={slide.link} className="font-semibold md:text-[22px]">
                          {slide.buttonText || slide.link.title}
                        </ButtonLink>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {count > 1 && (
        <div className="hidden justify-center gap-3 py-3 md:flex">
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              onClick={() => api?.scrollTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === selected}
              className={cn(
                'size-1.5 rounded-full bg-black transition-opacity',
                i === selected ? 'opacity-75' : 'opacity-25'
              )}
            />
          ))}
        </div>
      )}
    </section>
  )
}
