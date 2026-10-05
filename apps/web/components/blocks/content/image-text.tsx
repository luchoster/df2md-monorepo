import { stegaClean } from 'next-sanity'
import { ButtonLink } from '@/components/button-link'
import { PortableTextRenderer } from '@/components/portable-text-renderer'
import { SanityImage } from '@/components/sanity-image'
import { cn } from '@/lib/utils'
import { Section } from '../section'
import type { BlockOf } from '../types'

export default function ImageText({
  title,
  image,
  content,
  imageSide,
  cta,
  background,
  padding
}: BlockOf<'image-text'>) {
  const right = stegaClean(imageSide) === 'right'
  return (
    <Section padding={padding} background={background}>
      <div className="container grid items-center gap-8 md:grid-cols-2">
        <div className={cn(right && 'md:order-2')}>
          <SanityImage
            image={image}
            sizes="(min-width: 768px) 50vw, 100vw"
            className="h-auto w-full rounded"
          />
        </div>
        <div>
          {title && <h2>{title}</h2>}
          <PortableTextRenderer value={content as never} />
          {cta && <ButtonLink link={cta} className="mt-4" />}
        </div>
      </div>
    </Section>
  )
}
