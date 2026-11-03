'use client'

import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { Accordion as AccordionPrimitive } from 'radix-ui'
import { useEffect, useId, useState } from 'react'
import type { NavBrand, NavCategory } from '@/components/layout/nav-types'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const sectionTrigger =
  'py-3 text-base font-semibold uppercase tracking-wide text-foreground hover:no-underline [&>svg]:translate-y-0'

/**
 * Accordion state that re-opens `required` whenever it changes, so the branch holding the
 * active filter is visible after a client-side navigation without closing what the user opened.
 */
function useOpenValues(initial: string[], required?: string) {
  const [open, setOpen] = useState(initial)
  useEffect(() => {
    if (required) setOpen((prev) => (prev.includes(required) ? prev : [...prev, required]))
  }, [required])
  return [open, setOpen] as const
}

/** The top-level category that is active, or whose child is. */
const activeBranch = (categories: NavCategory[], active?: string) =>
  active
    ? categories.find((c) => c.slug === active || c.children.some((ch) => ch.slug === active))?._id
    : undefined

/**
 * sidebar_filters.js rebuilt: category tree (2 levels), brand list, "Clear filters".
 * Links keep the current brand when picking a category (as the old site did).
 * Only top-level categories show at first; a chevron next to each parent reveals its
 * subcategories, and the branch with the active category starts open.
 */
export function ShopSidebar({
  categories,
  brands,
  activeCategory,
  activeBrand,
  sort,
  email
}: {
  categories: NavCategory[]
  brands: NavBrand[]
  activeCategory?: string
  activeBrand?: string
  /** kept when switching category or brand */
  sort?: string
  email?: string | null
}) {
  const qs = (params: Record<string, string | undefined>) => {
    const search = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) if (v) search.set(k, v)
    if (sort && sort !== 'featured') search.set('sort', sort)
    const str = search.toString()
    return str ? `?${str}` : ''
  }
  const brandQuery = qs({ brand: activeBrand })
  const catBase = activeCategory ? `/shop/category/${activeCategory}` : '/shop'

  const branch = activeBranch(categories, activeCategory)
  const [sections, setSections] = useOpenValues(
    activeBrand ? ['categories', 'brand'] : ['categories'],
    activeBrand ? 'brand' : undefined
  )
  const [branches, setBranches] = useOpenValues(branch ? [branch] : [], branch)

  const filterId = useId()
  const [filter, setFilter] = useState('')
  const term = filter.trim().toLowerCase()
  const active = activeBrand ? brands.find((b) => b.slug === activeBrand) : undefined
  const others = brands.filter(
    (b) => b !== active && (!term || (b.title ?? '').toLowerCase().includes(term))
  )
  const brandList = active ? [active, ...others] : others

  return (
    <aside className="text-sm">
      <Accordion type="multiple" value={sections} onValueChange={setSections}>
        <AccordionItem value="categories">
          <AccordionTrigger className={sectionTrigger}>Categories</AccordionTrigger>
          <AccordionContent className="pb-3">
            <Accordion
              type="multiple"
              value={branches}
              onValueChange={setBranches}
              className="space-y-1"
            >
              {categories.map((c) => {
                const hasChildren = c.children.length > 0
                return (
                  <AccordionItem key={c._id} value={c._id} className="border-0">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/shop/category/${c.slug}${brandQuery}`}
                        aria-current={activeCategory === c.slug ? 'page' : undefined}
                        className={cn(
                          'block min-w-0 flex-1 rounded-md px-2 py-1.5 font-semibold uppercase text-foreground hover:bg-accent',
                          activeCategory === c.slug && 'bg-accent text-accent-foreground'
                        )}
                      >
                        {c.title}
                      </Link>
                      {hasChildren && (
                        <AccordionPrimitive.Trigger
                          aria-label={`Show ${c.title} subcategories`}
                          className="group grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                          <ChevronDown
                            aria-hidden
                            className="size-4 transition-transform duration-200 group-data-[state=open]:rotate-180"
                          />
                        </AccordionPrimitive.Trigger>
                      )}
                    </div>
                    {hasChildren && (
                      <AccordionContent className="pb-1">
                        <ul className="ml-3 border-l pl-2">
                          {c.children.map((child) => (
                            <li key={child._id}>
                              <Link
                                href={`/shop/category/${child.slug}${brandQuery}`}
                                aria-current={activeCategory === child.slug ? 'page' : undefined}
                                className={cn(
                                  'block rounded-md px-2 py-1 text-muted-foreground hover:bg-accent hover:text-foreground',
                                  activeCategory === child.slug &&
                                    'bg-accent font-semibold text-accent-foreground'
                                )}
                              >
                                {child.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    )}
                  </AccordionItem>
                )
              })}
            </Accordion>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="brand">
          <AccordionTrigger className={sectionTrigger}>Brand</AccordionTrigger>
          <AccordionContent className="pb-3">
            <label htmlFor={filterId} className="sr-only">
              Filter brands
            </label>
            <Input
              id={filterId}
              type="search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter brands"
              autoComplete="off"
              className="mb-2 h-8 text-sm"
            />
            <ul className="max-h-[280px] overflow-y-auto rounded-md border p-1">
              {brandList.map((b) => (
                <li key={b._id}>
                  <Link
                    href={`${catBase}${qs({ brand: b.slug ?? undefined })}`}
                    aria-current={activeBrand === b.slug ? 'page' : undefined}
                    className={cn(
                      'block rounded-md px-2 py-1.5 text-foreground hover:bg-accent',
                      activeBrand === b.slug && 'bg-accent font-semibold text-accent-foreground'
                    )}
                  >
                    {b.title}
                  </Link>
                </li>
              ))}
              {brandList.length === 0 && (
                <li className="px-2 py-1.5 text-muted-foreground">No brands match “{filter}”</li>
              )}
            </ul>
            <p className="mt-3 mb-0 text-xs text-muted-foreground">
              * If the brand you are looking for is not listed above, please{' '}
              <a
                href={`mailto:${email ?? 'info@dogfood2mydoor.com'}`}
                className="text-link underline"
              >
                let us know
              </a>
              .
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {(activeBrand || activeCategory) && (
        <Link
          href="/shop"
          className="mt-4 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          Clear filters
        </Link>
      )}
    </aside>
  )
}
