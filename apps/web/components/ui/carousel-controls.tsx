'use client'

import type { EmblaCarouselType } from 'embla-carousel'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** Round prev/next buttons shared by the hero and product carousels. */
export function CarouselArrows({
  api,
  className,
  buttonClassName,
  label = 'slides'
}: {
  api: EmblaCarouselType | undefined
  className?: string
  buttonClassName?: string
  label?: string
}) {
  return (
    <div className={cn('pointer-events-none absolute inset-x-0 flex justify-between', className)}>
      <Button
        type="button"
        variant="outline"
        size="icon-lg"
        onClick={() => api?.scrollPrev()}
        aria-label={`Previous ${label}`}
        className={cn(
          'pointer-events-auto rounded-full bg-background/90 shadow-md backdrop-blur hover:bg-background',
          buttonClassName
        )}
      >
        <ChevronLeft className="size-5" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon-lg"
        onClick={() => api?.scrollNext()}
        aria-label={`Next ${label}`}
        className={cn(
          'pointer-events-auto rounded-full bg-background/90 shadow-md backdrop-blur hover:bg-background',
          buttonClassName
        )}
      >
        <ChevronRight className="size-5" />
      </Button>
    </div>
  )
}

/** Pill dots: the active one stretches. */
export function CarouselDots({
  api,
  selected,
  count,
  className,
  tone = 'dark',
  label = 'slide'
}: {
  api: EmblaCarouselType | undefined
  selected: number
  count: number
  className?: string
  tone?: 'dark' | 'light'
  label?: string
}) {
  if (count < 2) return null
  return (
    <div className={cn('flex justify-center gap-2', className)}>
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => api?.scrollTo(i)}
          aria-label={`Go to ${label} ${i + 1}`}
          aria-current={i === selected}
          className={cn(
            'h-2 rounded-full transition-all duration-300',
            i === selected
              ? 'w-6 bg-primary'
              : tone === 'light'
                ? 'w-2 bg-white/70 hover:bg-white'
                : 'w-2 bg-foreground/20 hover:bg-foreground/40'
          )}
        />
      ))}
    </div>
  )
}
