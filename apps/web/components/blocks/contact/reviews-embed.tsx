import { Star } from 'lucide-react'
import { Section } from '../section'
import type { BlockOf } from '../types'

export default function ReviewsEmbed({
  heading,
  provider,
  embedUrl,
  reviews,
  padding
}: BlockOf<'reviews-embed'>) {
  return (
    <Section padding={padding}>
      <div className="container">
        {heading && <h1 className="mb-6">{heading}</h1>}
        {provider !== 'manual' && embedUrl ? (
          <iframe
            src={embedUrl}
            title={heading ?? 'Reviews'}
            className="h-[600px] w-full border-0"
            loading="lazy"
          />
        ) : reviews?.length ? (
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r) => (
              <li key={r._key} className="rounded border border-line p-5">
                <div
                  className="mb-2 flex text-sun"
                  role="img"
                  aria-label={`${r.rating} out of 5 stars`}
                >
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className="size-5"
                      fill={i < (r.rating ?? 0) ? 'currentColor' : 'none'}
                    />
                  ))}
                </div>
                <p className="mb-3">{r.text}</p>
                <p className="mb-0 font-semibold text-ink-900">— {r.author}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>Reviews are coming soon.</p>
        )}
      </div>
    </Section>
  )
}
