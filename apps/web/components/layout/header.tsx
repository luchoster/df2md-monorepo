import Image from 'next/image'
import Link from 'next/link'
import { CartLink } from '@/components/cart/cart-link'
import { formatPhone } from '@/lib/format'
import { hrefFor } from '@/lib/links'
import { getNavBrands, getSettings } from '@/sanity/lib/fetchers'
import { CategoryNav } from './category-nav'
import { Headroom } from './headroom'
import { MobileMenu } from './mobile-menu'
import { dropdownLinks } from './nav-types'
import { PromoBar } from './promo-bar'
import { SearchForm } from './search-form'

export async function Header() {
  const [settings, brands] = await Promise.all([getSettings(), getNavBrands()])
  const items = settings?.mainMenu ?? []
  const phone = settings?.contact?.phone
  const email = settings?.contact?.email

  return (
    <header>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-3"
      >
        Skip to content
      </a>
      <Headroom>
        {/* top bar */}
        <div className="hidden h-[50px] items-center justify-between bg-white px-5 text-2xl font-light text-body lg:flex">
          <p className="mb-0">
            {phone && (
              <a href={`tel:${phone.replace(/\D/g, '')}`} className="text-body">
                {formatPhone(phone)}
              </a>
            )}
            {phone && email && ' | '}
            {email && (
              <a href={`mailto:${email}`} className="text-ink-900">
                {email}
              </a>
            )}
          </p>
          <nav
            aria-label="Account"
            className="flex items-center gap-2 text-ink-900 [&_a]:text-ink-900"
          >
            <span aria-hidden>|</span>
            <Link href="/account">My Account</Link>
            <span aria-hidden>|</span>
            <Link href="/account/orders">Orders</Link>
            <span aria-hidden>|</span>
            <CartLink className="ml-4" />
          </nav>
        </div>

        {/* green bar */}
        <div className="hidden h-[150px] grid-cols-[2fr_3fr_2fr] items-center bg-brand px-5 py-[25px] text-white lg:grid">
          <div>
            <Link href="/" aria-label="Dog Food 2 My Door home" className="inline-block">
              <Image
                src="/brand/logo-white.png"
                alt="Dog Food 2 My Door"
                width={424}
                height={126}
                priority
                className="h-[90px] w-auto"
              />
            </Link>
            <p className="mb-0 pt-1 font-display text-xl font-semibold text-white">
              Locally owned - Shop Local
            </p>
          </div>
          <SearchForm className="max-w-[500px] justify-self-center" />
          <div />
        </div>

        <CategoryNav items={items} brands={brands} />
        <MobileMenu
          phone={phone ? formatPhone(phone) : null}
          email={email}
          items={items.map((item) => ({
            key: item._key,
            label: item.label ?? '',
            href: hrefFor(item.link) ?? '/shop',
            links: dropdownLinks(item, brands, hrefFor)
          }))}
        />
        <PromoBar announcement={settings?.announcement ?? null} />
      </Headroom>
    </header>
  )
}
