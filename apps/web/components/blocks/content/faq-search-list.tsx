'use client'

import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'

type Item = { key: string; question: string; text: string; answer: React.ReactNode }

export function FaqSearchList({
  items,
  placeholder,
  emptyText,
  email
}: {
  items: Item[]
  placeholder: string
  emptyText: string
  email: string | null
}) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
    if (!words.length) return items
    return items.filter((item) => {
      const haystack = `${item.question} ${item.text}`.toLowerCase()
      return words.every((word) => haystack.includes(word))
    })
  }, [items, query])

  return (
    <>
      <div className="relative mx-auto mt-10 w-full max-w-2xl">
        <Search
          className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          aria-label="Search questions"
          placeholder={placeholder}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-12 rounded-full pl-11 text-base"
        />
      </div>

      {filtered.length > 0 ? (
        <Accordion type="single" collapsible className="mx-auto mt-6 w-full max-w-2xl">
          {filtered.map((item) => (
            <AccordionItem key={item.key} value={item.key}>
              <AccordionTrigger className="text-left font-display text-lg font-semibold text-foreground hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div className="mt-12 flex flex-col items-center gap-2 text-center" aria-live="polite">
          <p className="font-medium text-foreground">No results for “{query.trim()}”</p>
          <p className="text-sm text-muted-foreground">
            {emptyText}{' '}
            {email && (
              <a href={`mailto:${email}`} className="font-medium text-brand hover:underline">
                {email}
              </a>
            )}
            .
          </p>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-muted-foreground tabular-nums" aria-live="polite">
        {filtered.length} of {items.length} questions
      </p>
    </>
  )
}
