import { ChevronDown } from 'lucide-react'
import { PortableTextRenderer } from '@/components/portable-text-renderer'
import { Section } from '../section'
import type { BlockOf } from '../types'

/** Native <details> accordion: no JS, keyboard accessible, and answers stay in the HTML for SEO. */
export default function FaqList({ heading, items, padding }: BlockOf<'faq-list'>) {
  return (
    <Section padding={padding}>
      <div className="container max-w-[960px]">
        {heading && <h2 className="mb-6">{heading}</h2>}
        <div className="divide-y divide-rule border-y border-rule">
          {items?.map((item) => (
            <details key={item._key} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-semibold text-ink-900 [&::-webkit-details-marker]:hidden">
                {item.question}
                <ChevronDown className="size-5 shrink-0 text-brand transition-transform group-open:rotate-180" />
              </summary>
              <div className="pt-3">
                <PortableTextRenderer value={item.answer as never} />
              </div>
            </details>
          ))}
        </div>
      </div>
    </Section>
  )
}
