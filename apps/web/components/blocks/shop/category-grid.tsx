import Link from 'next/link'
import { SanityImage } from '@/components/sanity-image'
import { cn } from '@/lib/utils'
import { Section } from '../section'
import type { BlockOf } from '../types'

const cols: Record<number, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
  6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
}

export default function CategoryGrid({
  heading,
  categories,
  columns,
  padding
}: BlockOf<'category-grid'>) {
  if (!categories?.length) return null
  return (
    <Section padding={padding}>
      <div className="container">
        {heading && <h2 className="mb-6 text-center">{heading}</h2>}
        <ul className={cn('grid gap-4', cols[columns ?? 4] ?? cols[4])}>
          {categories.map((c) => (
            <li key={c._id}>
              <Link
                href={`/shop/category/${c.slug}`}
                className="group relative flex aspect-[4/3] items-end overflow-hidden rounded bg-brand p-4 text-white no-underline hover:no-underline"
              >
                {c.image?.asset && (
                  <SanityImage
                    image={c.image}
                    fill
                    sizes="(min-width: 992px) 25vw, 50vw"
                    className="transition-transform duration-300 group-hover:scale-105"
                  />
                )}
                <span className="relative font-display text-xl font-semibold drop-shadow">
                  {c.title}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}
