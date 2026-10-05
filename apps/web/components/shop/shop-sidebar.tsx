import Link from 'next/link'
import type { NavBrand, NavCategory } from '@/components/layout/nav-types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

/**
 * sidebar_filters.js rebuilt: category tree (2 levels), brand list, "Clear filters".
 * Links keep the current brand when picking a category (as the old site did).
 */
export function ShopSidebar({
  categories,
  brands,
  activeCategory,
  activeBrand,
  email
}: {
  categories: NavCategory[]
  brands: NavBrand[]
  activeCategory?: string
  activeBrand?: string
  email?: string | null
}) {
  const brandQuery = activeBrand ? `?brand=${encodeURIComponent(activeBrand)}` : ''
  const catBase = activeCategory ? `/shop/category/${activeCategory}` : '/shop'
  return (
    <aside className="space-y-8 text-sm">
      <section>
        <h2 className="mb-3 text-base uppercase tracking-wide">Categories</h2>
        <ul className="space-y-1">
          {categories.map((c) => (
            <li key={c._id}>
              <Link
                href={`/shop/category/${c.slug}${brandQuery}`}
                className={cn(
                  'block rounded-md px-2 py-1.5 font-semibold uppercase text-foreground hover:bg-accent',
                  activeCategory === c.slug && 'bg-accent text-accent-foreground'
                )}
              >
                {c.title}
              </Link>
              {c.children.length > 0 && (
                <ul className="ml-3 border-l pl-2">
                  {c.children.map((child) => (
                    <li key={child._id}>
                      <Link
                        href={`/shop/category/${child.slug}${brandQuery}`}
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
              )}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-base uppercase tracking-wide">Select your brand</h2>
        <ScrollArea className="h-[300px] rounded-md border">
          <ul className="p-1">
            {brands.map((b) => (
              <li key={b._id}>
                <Link
                  href={`${catBase}?brand=${encodeURIComponent(b.slug ?? '')}`}
                  className={cn(
                    'block rounded-md px-2 py-1.5 text-foreground hover:bg-accent',
                    activeBrand === b.slug && 'bg-accent font-semibold text-accent-foreground'
                  )}
                >
                  {b.title}
                </Link>
              </li>
            ))}
          </ul>
        </ScrollArea>
        <p className="mt-3 text-xs text-muted-foreground">
          * If the brand you are looking for is not listed above, please{' '}
          <a href={`mailto:${email ?? 'info@dogfood2mydoor.com'}`} className="text-link underline">
            let us know
          </a>
          .
        </p>
      </section>

      {(activeBrand || activeCategory) && (
        <Link
          href="/shop"
          className="inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          Clear filters
        </Link>
      )}
    </aside>
  )
}
