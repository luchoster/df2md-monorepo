'use client'

import { Menu } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CartLink } from '@/components/cart/cart-link'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import type { DropdownLink } from './nav-types'
import { SearchForm } from './search-form'

export type MobileNavItem = { key: string; label: string; href: string; links: DropdownLink[] }

/** <992px: green bar with menu, logo and cart; the menu is a shadcn Sheet from the left. */
export function MobileMenu({
  items,
  phone,
  email
}: {
  items: MobileNavItem[]
  phone?: string | null
  email?: string | null
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  useEffect(() => {
    if (pathname) setOpen(false)
  }, [pathname])

  return (
    <div className="flex h-[65px] items-center justify-between bg-brand px-3 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon-lg"
            className="text-[#85dca9] hover:bg-white/10 hover:text-white"
            aria-label="Open menu"
          >
            <Menu className="size-7" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[min(85vw,380px)] gap-0 p-0">
          <SheetHeader className="bg-brand p-4">
            <SheetTitle className="text-white">Menu</SheetTitle>
            <SearchForm id="mobile-search" />
          </SheetHeader>
          <nav aria-label="Categories" className="flex-1 overflow-y-auto">
            <Accordion type="single" collapsible>
              {items.map((item) =>
                item.links.length ? (
                  <AccordionItem key={item.key} value={item.key} className="px-4">
                    <AccordionTrigger className="font-display text-base font-bold uppercase text-foreground">
                      {item.label}
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="max-h-[300px] overflow-y-auto">
                        <li>
                          <Link href={item.href} className="block py-2 font-semibold text-primary">
                            View all {item.label}
                          </Link>
                        </li>
                        {item.links.map((l) => (
                          <li key={l.key}>
                            <Link href={l.href} className="block py-2 text-foreground">
                              {l.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ) : (
                  <div key={item.key} className="border-b px-4">
                    <Link
                      href={item.href}
                      className="block py-4 font-display font-bold uppercase text-foreground no-underline"
                    >
                      {item.label}
                    </Link>
                  </div>
                )
              )}
            </Accordion>
            <ul className="px-4 py-3 text-lg">
              <li>
                <Link href="/account" className="block py-2 text-foreground">
                  My Account
                </Link>
              </li>
              <li>
                <Link href="/account/orders" className="block py-2 text-foreground">
                  Orders
                </Link>
              </li>
              <li>
                <Link href="/cart" className="block py-2 text-foreground">
                  Cart
                </Link>
              </li>
            </ul>
          </nav>
          {(phone || email) && (
            <div className="border-t px-4 py-3 text-sm">
              {phone && (
                <a href={`tel:${phone.replace(/\D/g, '')}`} className="block">
                  {phone}
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className="block">
                  {email}
                </a>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
      <Link href="/" aria-label="Dog Food 2 My Door home">
        <Image
          src="/brand/logo-white.png"
          alt="Dog Food 2 My Door"
          width={424}
          height={126}
          className="h-[50px] w-auto md:h-[56px]"
          priority
        />
      </Link>
      <CartLink
        showLabel={false}
        className="grid size-11 place-items-center text-white hover:no-underline"
      />
    </div>
  )
}
