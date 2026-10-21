import { Phone } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { SearchForm } from '@/components/layout/search-form'
import { Button } from '@/components/ui/button'
import { formatPhone, formatPhoneHref } from '@/lib/format'
import { hrefFor } from '@/lib/links'
import { getSettings } from '@/sanity/lib/fetchers'

export const metadata: Metadata = { title: 'Page not found' }

/** Any unknown URL (and notFound() calls): search, the main categories, and the store's phone. */
export default async function NotFound() {
  const settings = await getSettings()
  const phone = settings?.contact?.phone ?? '702-971-2484'
  const links = (settings?.mainMenu ?? [])
    .map((item) => ({ key: item._key, label: item.label, href: hrefFor(item.link) }))
    .filter((l): l is { key: string; label: string; href: string } => Boolean(l.label && l.href))

  return (
    <section
      className="relative overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: 'url(/brand/section-bg-badge.png)' }}
    >
      <div className="container relative mx-auto flex min-h-[60vh] max-w-2xl justify-center flex-col items-center py-16 text-center md:py-24">
        <p className="mb-2 font-display text-7xl font-bold text-sun md:text-9xl">404</p>
        <h1 className="mb-3 text-3xl text-white md:text-4xl">We couldn’t sniff out that page</h1>
        <p className="mb-8 text-white/90 md:text-lg">
          The link may be old or mistyped. Try a search, pick a category, or give us a call and
          we’ll help you find what you need.
        </p>
        <SearchForm id="not-found-search" className="mb-8 max-w-md [&_input]:border-line" />
        {links.length > 0 && (
          <nav aria-label="Shop categories" className="mb-8 flex flex-wrap justify-center gap-2">
            {links.map((l) => (
              <Button key={l.key} asChild variant="outline" size="sm">
                <Link href={l.href}>{l.label}</Link>
              </Button>
            ))}
          </nav>
        )}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/">Back to home</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href={formatPhoneHref(phone)}>
              <Phone /> {formatPhone(phone)}
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}
