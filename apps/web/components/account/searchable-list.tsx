'use client'

import { Search } from 'lucide-react'
import { useState } from 'react'
import { Input } from '@/components/ui/input'

/** Filters server-rendered rows by their search text (Order History 3's search box). */
export function SearchableList({
  items,
  label,
  empty
}: {
  items: { key: string; text: string; node: React.ReactNode }[]
  label: string
  empty: (query: string) => React.ReactNode
}) {
  const [query, setQuery] = useState('')
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const shown = words.length
    ? items.filter((i) => words.every((w) => i.text.toLowerCase().includes(w)))
    : items
  return (
    <>
      <div className="relative sm:w-64">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          aria-label={label}
          placeholder="Search orders"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="space-y-5 sm:col-span-2">
        {shown.map((i) => (
          <div key={i.key}>{i.node}</div>
        ))}
        {shown.length === 0 && empty(query.trim())}
      </div>
    </>
  )
}
