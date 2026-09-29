import { PortableTextRenderer } from '@/components/portable-text-renderer'
import { Section } from '../section'
import type { BlockOf } from '../types'
import { FaqSearchList } from './faq-search-list'

/** shadcnblocks FAQ 28 (searchable accordion). Answers render here; filtering runs client-side. */
export default function FaqSearch(props: BlockOf<'faq-search'> & { isFirst?: boolean }) {
  const { label, heading, description, searchPlaceholder, emptyText, items, email, padding } = props
  const Heading = props.isFirst ? 'h1' : 'h2'
  return (
    <Section padding={padding}>
      <div className="container flex max-w-5xl flex-col">
        <div className="flex flex-col items-center gap-3 text-center">
          {label && (
            <span className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              {label}
            </span>
          )}
          <Heading className="max-w-3xl text-3xl tracking-tight text-balance md:text-5xl">
            {heading}
          </Heading>
          {description && (
            <p className="max-w-md text-balance text-muted-foreground">{description}</p>
          )}
        </div>
        <FaqSearchList
          placeholder={searchPlaceholder ?? 'Search questions...'}
          emptyText={emptyText ?? 'Try different keywords or email us at'}
          email={email ?? null}
          items={(items ?? []).map((item) => ({
            key: item._key,
            question: item.question ?? '',
            text: item.answerText ?? '',
            answer: <PortableTextRenderer value={item.answer as never} />
          }))}
        />
      </div>
    </Section>
  )
}
