'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
interface FaqItem {
  question: string
  answer: string
}

interface Faq28Props {
  label: string
  heading: string
  description: string
  searchPlaceholder: string
  items: FaqItem[]
  emptyTitle: string
  emptyDescription: string
  emptyLinkLabel: string
  emptyLinkUrl: string
  className?: string
}

type Props = Partial<Faq28Props>

const defaultItems: FaqItem[] = [
  {
    question: 'What is included in the catalog?',
    answer:
      'Production-ready React sections built on shadcn/ui. Each one ships as a single file you can edit.'
  },
  {
    question: 'How do I install a section?',
    answer:
      'Add the registry to your components config, then run the shadcn add command for the section id.'
  },
  {
    question: 'Which stack is required?',
    answer: 'React, Tailwind, and shadcn/ui. Sections read your CSS variables automatically.'
  },
  {
    question: 'Are the sections accessible?',
    answer:
      'Each paid section is checked for focus rings, ARIA labels, keyboard navigation, and contrast before it ships.'
  },
  {
    question: 'Can I edit the source?',
    answer:
      'Yes. The file lands as plain source in your repo. No proprietary runtime and no lock-in.'
  },
  {
    question: 'What does the license cover?',
    answer:
      'Personal projects, side products, and client work. No per-seat or per-project restrictions.'
  },
  {
    question: 'Can I resell sections?',
    answer:
      'No. You can use them inside products you build. Repackaging and reselling the sections themselves is not allowed.'
  },
  {
    question: 'How often do new sections ship?',
    answer: 'About every two weeks. Paid workspaces receive every future section at no extra cost.'
  },
  {
    question: 'Is there a team plan?',
    answer:
      'Yes. The team plan covers up to ten developers, each with their own token tied to the shared license.'
  },
  {
    question: 'What about refunds?',
    answer:
      'Sales are final. The free sections let you validate the full workflow before you upgrade.'
  }
]

const defaultProps: Faq28Props = {
  label: 'FAQ',
  heading: 'Find your answer',
  description: 'Type a keyword below and the list narrows instantly.',
  searchPlaceholder: 'Search questions...',
  items: defaultItems,
  emptyTitle: 'No results for',
  emptyDescription: 'Try different keywords or write to',
  emptyLinkLabel: 'hello@example.com',
  emptyLinkUrl: 'mailto:hello@example.com'
}

const Faq28 = (props: Props) => {
  const {
    label,
    heading,
    description,
    searchPlaceholder,
    items,
    emptyTitle,
    emptyDescription,
    emptyLinkLabel,
    emptyLinkUrl,
    className
  } = {
    ...defaultProps,
    ...props
  }

  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (item) => item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q)
    )
  }, [items, query])

  return (
    <section className={cn('py-32', className)}>
      <div className="container mx-auto">
        <div className="mx-auto flex max-w-5xl flex-col">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              {label}
            </span>
            <h2 className="max-w-3xl text-3xl font-semibold tracking-tight text-balance text-foreground md:text-4xl">
              {heading}
            </h2>
            <p className="max-w-md text-balance text-muted-foreground">{description}</p>
          </div>

          <div className="relative mx-auto mt-10 w-full max-w-2xl">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="rounded-full pl-10"
            />
          </div>

          {filtered.length > 0 ? (
            <Accordion type="single" collapsible className="mx-auto mt-6 w-full max-w-2xl">
              {filtered.map((item, index) => (
                <AccordionItem key={item.question} value={`item-${index}`}>
                  <AccordionTrigger className="text-left hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="mt-12 flex flex-col items-center gap-2 text-center">
              <p className="text-sm font-medium text-foreground">
                {emptyTitle} "{query}"
              </p>
              <p className="text-xs text-muted-foreground">
                {emptyDescription}{' '}
                <a
                  href={emptyLinkUrl}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {emptyLinkLabel}
                </a>
                .
              </p>
            </div>
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground tabular-nums">
            {filtered.length} of {items.length} questions
          </p>
        </div>
      </div>
    </section>
  )
}

export { Faq28 }
