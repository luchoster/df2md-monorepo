import { PortableTextRenderer } from '@/components/portable-text-renderer'
import { SanityImage } from '@/components/sanity-image'
import { ButtonLink } from '@/components/ui/button'
import { Section } from '../section'
import type { BlockOf } from '../types'

export default function CtaBanner({
  text,
  button,
  background,
  image,
  padding
}: BlockOf<'cta-banner'>) {
  return (
    <Section padding={padding} background={background} className="relative overflow-hidden">
      {image?.asset && (
        <div className="absolute inset-0 -z-0 opacity-30">
          <SanityImage image={image} fill sizes="100vw" />
        </div>
      )}
      <div className="container relative flex flex-col items-center gap-4 text-center text-xl md:flex-row md:justify-between md:text-left">
        <PortableTextRenderer value={text as never} />
        {button && <ButtonLink link={button} size="lg" className="shrink-0" />}
      </div>
    </Section>
  )
}
