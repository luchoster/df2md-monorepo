import { ChevronRight } from 'lucide-react'
import { stegaClean } from 'next-sanity'
import { ButtonLink } from '@/components/button-link'
import { SanityImage } from '@/components/sanity-image'
import { cn } from '@/lib/utils'
import { Section } from '../section'
import type { BlockOf } from '../types'

/** shadcnblocks Feature 62 (alternating image-and-text rows) with a centered heading, fed by Sanity. */
export default function FeatureRows({
  heading,
  subheading,
  rows,
  firstImageSide,
  background,
  padding
}: BlockOf<'feature-rows'>) {
  const startRight = stegaClean(firstImageSide) === 'right'
  return (
    <Section padding={padding} background={background}>
      <div className="container">
        {(heading || subheading) && (
          <div className="mx-auto mb-12 max-w-2xl text-center md:mb-16">
            {heading && (
              <h2 className="mb-4 text-3xl tracking-tight text-balance md:text-5xl">{heading}</h2>
            )}
            {subheading && (
              <p className="text-balance text-muted-foreground lg:text-lg">{subheading}</p>
            )}
          </div>
        )}
        <div className="flex flex-col gap-10 md:gap-16">
          {rows?.map((row, index) => {
            const imageRight = (index % 2 === 1) !== startRight
            return (
              <div
                key={row._key}
                className="grid items-center gap-6 md:gap-8 lg:grid-cols-2 lg:gap-4"
              >
                <div
                  className={cn(
                    'relative aspect-4/3 w-full overflow-hidden rounded-xl border',
                    imageRight && 'lg:order-2'
                  )}
                >
                  <SanityImage image={row.image} fill sizes="(min-width: 1024px) 45vw, 100vw" />
                </div>
                <div className={cn(imageRight ? 'lg:pr-24 2xl:pr-32' : 'lg:pl-24 2xl:pl-32')}>
                  <h3 className="mb-3 text-xl md:mb-4 md:text-4xl lg:mb-6">{row.title}</h3>
                  {row.description && (
                    <p className="text-muted-foreground lg:text-lg">{row.description}</p>
                  )}
                  {row.link && (
                    <ButtonLink link={row.link} variant="link" className="mt-4 gap-1 px-0">
                      {row.link.title}
                      <ChevronRight className="size-4" aria-hidden />
                    </ButtonLink>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Section>
  )
}
