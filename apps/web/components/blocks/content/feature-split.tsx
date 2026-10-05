import { Check } from 'lucide-react'
import { stegaClean } from 'next-sanity'
import { ButtonLink } from '@/components/button-link'
import { SanityImage } from '@/components/sanity-image'
import { cn } from '@/lib/utils'
import { Section } from '../section'
import type { BlockOf } from '../types'

/** shadcnblocks Feature 6 (checklist beside a square image) fed by Sanity. */
export default function FeatureSplit({
  heading,
  description,
  checklist,
  image,
  imageSide,
  button,
  background,
  padding
}: BlockOf<'feature-split'>) {
  const left = stegaClean(imageSide) === 'left'
  return (
    <Section padding={padding} background={background}>
      <div className="container grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className={cn('flex flex-col lg:items-start', left && 'lg:order-2')}>
          <h2 className="mb-5 text-3xl tracking-tight text-pretty lg:text-5xl">{heading}</h2>
          {description && (
            <p className="mb-8 max-w-xl text-muted-foreground lg:text-lg">{description}</p>
          )}
          {(checklist?.length ?? 0) > 0 && (
            <ul className="space-y-4">
              {checklist?.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent">
                    <Check className="size-4 text-primary" aria-hidden />
                  </span>
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          )}
          {button && <ButtonLink link={button} size="lg" className="mt-8" />}
        </div>
        <div className="relative aspect-square w-full overflow-hidden rounded-xl border">
          <SanityImage image={image} fill sizes="(min-width: 1024px) 45vw, 100vw" />
        </div>
      </div>
    </Section>
  )
}
