import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { hrefFor } from '@/lib/links'
import { cn } from '@/lib/utils'
import { dropdownLinks, type NavBrand, type NavItem } from './nav-types'

/**
 * The black category bar (≥992px). Dropdowns open on hover and on keyboard focus (CSS only),
 * as the old `.main-nav` mega-menu did: white panel, 3 columns, max 400px tall with scroll.
 */
export function CategoryNav({ items, brands }: { items: NavItem[]; brands: NavBrand[] }) {
  return (
    <nav aria-label="Categories" className="hidden h-[60px] bg-nav lg:block">
      <ul className="mx-auto flex h-full max-w-[1610px] items-stretch justify-evenly">
        {items.map((item) => {
          const href = hrefFor(item.link) ?? '/shop'
          const links = dropdownLinks(item, brands, hrefFor)
          return (
            <li key={item._key} className="group relative flex items-center">
              <Link
                href={href}
                className="flex items-center gap-1 font-display text-xl font-bold uppercase text-white no-underline transition-colors duration-250 hover:text-sun hover:no-underline focus-visible:text-sun 2xl:text-[1.75rem]"
                aria-haspopup={links.length ? 'true' : undefined}
              >
                {item.label}
                {links.length > 0 && <ChevronDown className="size-5 stroke-[3]" aria-hidden />}
              </Link>
              {links.length > 0 && (
                <div
                  className={cn(
                    'invisible absolute top-[95%] left-0 z-50 pt-3 opacity-0 transition-opacity duration-500',
                    'group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100'
                  )}
                >
                  {/* arrow */}
                  <span
                    className="absolute top-[7px] left-5 size-3 rotate-45 rounded-tl-[1px] bg-white shadow-arrow"
                    aria-hidden
                  />
                  <ul
                    className={cn(
                      'relative grid max-h-[400px] gap-x-2.5 overflow-y-auto bg-white px-5 py-1 shadow-lg',
                      links.length > 8 ? 'w-[min(780px,90vw)] grid-cols-3' : 'w-64 grid-cols-1'
                    )}
                  >
                    {links.map((l) => (
                      <li key={l.key} className="border-b border-rule/60">
                        <Link
                          href={l.href}
                          className="block py-3 text-[15px] font-normal uppercase text-ink-900 no-underline hover:text-brand hover:no-underline"
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
