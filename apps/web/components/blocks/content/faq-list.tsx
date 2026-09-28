import { PortableTextRenderer } from '@/components/portable-text-renderer'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { Section } from '../section'
import type { BlockOf } from '../types'

export default function FaqList({ heading, items, padding }: BlockOf<'faq-list'>) {
  return (
    <Section padding={padding}>
      <div className="container max-w-[960px]">
        {heading && <h2 className="mb-6">{heading}</h2>}
        <Accordion type="multiple" className="border-y">
          {items?.map((item) => (
            <AccordionItem key={item._key} value={item._key}>
              <AccordionTrigger className="font-display text-lg font-semibold text-foreground hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-base">
                <PortableTextRenderer value={item.answer as never} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  )
}
