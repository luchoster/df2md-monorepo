'use client'

import { ChevronDown, Menu, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { CartLink } from '@/components/cart/cart-link'
import type { DropdownLink } from './nav-types'
import { SearchForm } from './search-form'

export type MobileNavItem = { key: string; label: string; href: string; links: DropdownLink[] }

/**
 * <992px: green bar with menu, logo and cart; the menu is a left drawer (native <dialog>, so
 * focus trapping, Esc and the backdrop come for free). The old site rendered no header here.
 */
export function MobileMenu({
  items,
  phone,
  email
}: {
  items: MobileNavItem[]
  phone?: string | null
  email?: string | null
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [openKey, setOpenKey] = useState<string | null>(null)
  const pathname = usePathname()

  // close after navigating
  useEffect(() => {
    if (pathname) dialog.current?.close()
  }, [pathname])

  return (
    <div className="flex h-[65px] items-center justify-between bg-brand px-3 lg:hidden">
      <button
        onClick={() => dialog.current?.showModal()}
        className="grid size-11 place-items-center text-[#85dca9]"
        aria-label="Open menu"
      >
        <Menu className="size-8" />
      </button>
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

      {/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop click; Esc closes a modal <dialog> natively */}
      <dialog
        ref={dialog}
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
        className="m-0 h-dvh max-h-dvh w-[min(85vw,380px)] max-w-none bg-white p-0 backdrop:bg-black/50"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between bg-brand px-4 py-3">
            <span className="font-display font-semibold text-white">Menu</span>
            <button
              onClick={() => dialog.current?.close()}
              className="text-white"
              aria-label="Close menu"
            >
              <X className="size-6" />
            </button>
          </div>
          <div className="bg-brand px-4 pb-4">
            <SearchForm id="mobile-search" />
          </div>
          <nav aria-label="Categories" className="flex-1 overflow-y-auto">
            <ul>
              {items.map((item) => (
                <li key={item.key} className="border-b border-rule">
                  {item.links.length ? (
                    <>
                      <button
                        onClick={() => setOpenKey(openKey === item.key ? null : item.key)}
                        aria-expanded={openKey === item.key}
                        className="flex w-full items-center justify-between px-4 py-3 text-left font-display font-bold uppercase text-ink-900"
                      >
                        {item.label}
                        <ChevronDown
                          className={`size-5 transition-transform ${openKey === item.key ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {openKey === item.key && (
                        <ul className="max-h-[300px] overflow-y-auto bg-footer pb-2">
                          <li>
                            <Link
                              href={item.href}
                              className="block px-6 py-2 font-semibold text-ink-900"
                            >
                              View all
                            </Link>
                          </li>
                          {item.links.map((l) => (
                            <li key={l.key}>
                              <Link href={l.href} className="block px-6 py-2 text-ink-900">
                                {l.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      className="block px-4 py-3 font-display font-bold uppercase text-ink-900 no-underline"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
            <ul className="mt-2 px-4 py-2 text-lg">
              <li>
                <Link href="/account" className="block py-2 text-ink-900">
                  My Account
                </Link>
              </li>
              <li>
                <Link href="/account/orders" className="block py-2 text-ink-900">
                  Orders
                </Link>
              </li>
              <li>
                <Link href="/cart" className="block py-2 text-ink-900">
                  Cart
                </Link>
              </li>
            </ul>
          </nav>
          {(phone || email) && (
            <div className="border-t border-rule px-4 py-3 text-sm">
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
        </div>
      </dialog>
    </div>
  )
}
