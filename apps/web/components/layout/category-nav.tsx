import Link from 'next/link'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger
} from '@/components/ui/navigation-menu'
import { hrefFor } from '@/lib/links'
import { cn } from '@/lib/utils'
import { dropdownLinks, type NavBrand, type NavItem } from './nav-types'

const itemClass =
  'h-[60px] rounded-none bg-transparent px-2 font-display text-xl font-bold uppercase text-white no-underline transition-colors hover:bg-transparent hover:text-sun hover:no-underline focus:bg-transparent focus:text-sun focus-visible:ring-0 data-[state=open]:bg-transparent data-[state=open]:text-sun data-[state=open]:hover:bg-transparent data-[state=open]:focus:bg-transparent 2xl:text-[1.75rem]'

/**
 * The black category bar (≥992px) on shadcn's NavigationMenu: hover or keyboard opens the
 * dropdown (all brands / subcategories / custom links), arrow keys move between items.
 */
export function CategoryNav({ items, brands }: { items: NavItem[]; brands: NavBrand[] }) {
  return (
    <div className="hidden bg-nav lg:block">
      <NavigationMenu
        viewport={false}
        aria-label="Categories"
        className="mx-auto h-[60px] w-full max-w-[1610px] [&>div]:w-full"
      >
        <NavigationMenuList className="w-full justify-evenly gap-0">
          {items.map((item) => {
            const href = hrefFor(item.link) ?? '/shop'
            const links = dropdownLinks(item, brands, hrefFor)
            if (!links.length)
              return (
                <NavigationMenuItem key={item._key}>
                  <NavigationMenuLink
                    asChild
                    className={cn(itemClass, 'flex items-center justify-center')}
                  >
                    <Link href={href}>{item.label}</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )
            const wide = links.length > 8
            return (
              <NavigationMenuItem key={item._key}>
                <NavigationMenuTrigger
                  className={cn(itemClass, '[&>svg]:size-5 [&>svg]:stroke-[3]')}
                >
                  {item.label}
                </NavigationMenuTrigger>
                <NavigationMenuContent className="!mt-0 !rounded-t-none !border-0 !p-0 shadow-xl">
                  <div
                    className={cn(
                      'max-h-[420px] overflow-y-auto p-4',
                      wide ? 'w-[min(820px,90vw)]' : 'w-72'
                    )}
                  >
                    <NavigationMenuLink
                      asChild
                      className="mb-2 block rounded-md px-3 py-2 font-semibold text-primary"
                    >
                      <Link href={href}>View all {item.label}</Link>
                    </NavigationMenuLink>
                    <ul className={cn('grid gap-x-3', wide ? 'grid-cols-3' : 'grid-cols-1')}>
                      {links.map((l) => (
                        <li key={l.key} className="border-b border-border/60 last:border-0">
                          <NavigationMenuLink
                            asChild
                            className="block rounded-md px-3 py-2.5 text-sm uppercase text-foreground no-underline hover:no-underline"
                          >
                            <Link href={l.href}>{l.label}</Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            )
          })}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  )
}
