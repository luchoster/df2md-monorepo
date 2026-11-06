import Link from 'next/link'
import { SanityImage } from '@/components/sanity-image'
import { Section } from '../section'
import type { BlockOf } from '../types'

export default function BrandStrip({
  heading,
  brands,
  linkToShop,
  padding,
  isFirst
}: BlockOf<'brand-strip'> & { isFirst?: boolean }) {
  const Heading = isFirst ? 'h1' : 'h2'
  if (!brands?.length) return null
  return (
    <Section padding={padding}>
      <div className="container">
        {heading && <Heading className="mb-6 text-center">{heading}</Heading>}
        <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          {brands.map((b) => {
            const inner = b.logo?.asset ? (
              <SanityImage
                image={b.logo}
                alt={b.title ?? ''}
                sizes="160px"
                className="h-12 w-auto object-contain"
              />
            ) : (
              <span className="font-display font-semibold text-ink-900">{b.title}</span>
            )
            return (
              <li key={b._id}>
                {linkToShop ? (
                  <Link
                    href={`/shop?brand=${b.slug}`}
                    className="block opacity-80 transition-opacity hover:opacity-100"
                  >
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </Section>
  )
}
