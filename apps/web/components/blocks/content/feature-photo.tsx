import { ChevronRight } from 'lucide-react'
import { stegaClean } from 'next-sanity'
import { ButtonLink } from '@/components/button-link'
import { SanityImage } from '@/components/sanity-image'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Section } from '../section'
import type { BlockOf } from '../types'

/** shadcnblocks Feature 109 (copy beside a framed photo with an overlay), fed by Sanity. */
export default function FeaturePhoto({
  badge,
  heading,
  description,
  button,
  image,
  imageSide,
  chip,
  chipImage,
  overlayHeading,
  overlayLink,
  background,
  padding
}: BlockOf<'feature-photo'>) {
  const left = stegaClean(imageSide) === 'left'
  const hasOverlay = chip || overlayHeading || overlayLink
  return (
    <Section padding={padding} background={background}>
      <div className="container grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className={cn('flex flex-col gap-5', left && 'lg:order-2')}>
          {badge && (
            <Badge variant="outline" className="w-fit bg-background text-foreground">
              {badge}
            </Badge>
          )}
          <h2 className="text-3xl tracking-tight text-pretty lg:text-5xl">{heading}</h2>
          {description && <p className="text-muted-foreground lg:text-lg">{description}</p>}
          {button && <ButtonLink link={button} size="lg" className="mt-2.5 w-fit" />}
        </div>
        <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl md:aspect-video lg:aspect-4/3">
          <SanityImage image={image} fill sizes="(min-width: 1024px) 45vw, 100vw" />
          {hasOverlay && (
            <>
              <div className="absolute inset-0 bg-linear-to-t from-brand from-10% via-brand/40 via-45% to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-between p-5 md:p-7">
                {chip ? (
                  <span className="ml-auto flex w-fit items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-foreground backdrop-blur-sm">
                    {chipImage?.asset && (
                      <span className="relative size-7 overflow-hidden rounded-full">
                        <SanityImage image={chipImage} fill sizes="28px" />
                      </span>
                    )}
                    {chip}
                  </span>
                ) : (
                  <span />
                )}
                <div className="flex flex-col gap-3 text-white md:gap-5">
                  {overlayHeading && (
                    <p className="font-display text-lg font-semibold text-balance lg:text-3xl">
                      {overlayHeading}
                    </p>
                  )}
                  {overlayLink && (
                    <ButtonLink
                      link={overlayLink}
                      variant="link"
                      className="h-auto w-fit gap-1 px-0 text-white"
                    >
                      {overlayLink.title}
                      <ChevronRight className="size-4" aria-hidden />
                    </ButtonLink>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Section>
  )
}
