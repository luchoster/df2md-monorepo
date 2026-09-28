import { stegaClean } from 'next-sanity'
import { PortableTextRenderer } from '@/components/portable-text-renderer'
import { SanityImage } from '@/components/sanity-image'
import { ButtonLink } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Section } from '../section'
import type { BlockOf } from '../types'

/**
 * "band": the home sign-up section (50vh, centered bold copy, full-width button, badge artwork
 * from section_bg.png). "bar": a slim one-line banner.
 */
export default function CtaBanner({
  text,
  button,
  background,
  image,
  decoration,
  size,
  padding
}: BlockOf<'cta-banner'>) {
  const band = stegaClean(size) !== 'bar'
  const badge = !image?.asset && stegaClean(decoration) === 'badge'
  return (
    <Section
      padding={padding}
      background={background}
      className={cn('relative overflow-hidden', band && 'flex min-h-[50vh] items-center')}
      style={
        badge
          ? {
              backgroundImage: 'url(/brand/section-bg-badge.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }
          : undefined
      }
    >
      {image?.asset && (
        <div className="absolute inset-0 opacity-30">
          <SanityImage image={image} fill sizes="100vw" />
        </div>
      )}
      {band ? (
        <div className="container relative mx-auto flex max-w-[960px] flex-col items-center py-10 text-center">
          <PortableTextRenderer
            value={text as never}
            className="font-display text-2xl leading-tight font-semibold md:text-[40px] [&_p]:mb-2"
          />
          {button && (
            <ButtonLink link={button} size="block" className="max-w-[460px] text-sm uppercase" />
          )}
        </div>
      ) : (
        <div className="container relative flex flex-col items-center gap-3 py-3 text-center text-xl md:flex-row md:justify-center">
          <PortableTextRenderer value={text as never} className="[&_p]:mb-0" />
          {button && <ButtonLink link={button} size="sm" className="my-0 uppercase" />}
        </div>
      )}
    </Section>
  )
}
