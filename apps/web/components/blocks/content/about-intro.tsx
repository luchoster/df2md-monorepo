import { ButtonLink } from '@/components/button-link'
import { SanityImage } from '@/components/sanity-image'
import { Section } from '../section'
import type { BlockOf } from '../types'

/** shadcnblocks About 37 (editorial intro with a photo pair), fed by Sanity. */
export default function AboutIntro(props: BlockOf<'about-intro'> & { isFirst?: boolean }) {
  const { heading, description, button, images, background, padding, isFirst } = props
  const Heading = isFirst ? 'h1' : 'h2'
  const gallery = images?.filter((image) => image.asset).slice(0, 2) ?? []
  return (
    <Section padding={padding} background={background}>
      <div className="container flex flex-col gap-12 md:gap-16">
        <div className="grid gap-8 md:grid-cols-2 md:items-start md:gap-16">
          <div className="flex max-w-xl flex-col items-start gap-6">
            <Heading className="text-4xl tracking-tight md:text-6xl">{heading}</Heading>
            {button && <ButtonLink link={button} variant="outline" size="lg" />}
          </div>
          {description && (
            <p className="text-lg whitespace-pre-line text-muted-foreground md:text-xl">
              {description}
            </p>
          )}
        </div>
        {gallery.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2">
            {gallery.map((image) => (
              <div key={image._key} className="relative aspect-video overflow-hidden rounded-2xl">
                <SanityImage image={image} fill sizes="(min-width: 768px) 50vw, 100vw" />
              </div>
            ))}
          </div>
        )}
      </div>
    </Section>
  )
}
