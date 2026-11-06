import { siteOrigin } from '@/lib/site-url'
import { getSettings } from '@/sanity/lib/fetchers'
import { SITE_NAME } from '@/sanity/lib/metadata'

/** "Henderson, NV 89012" → locality, region, postal code. */
function parseCityLine(line: string | undefined) {
  const m = line?.match(/^(.+?),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/)
  return m ? { addressLocality: m[1], addressRegion: m[2], postalCode: m[3] } : {}
}

/**
 * Structured data for the store itself, from the same site settings the header and footer
 * show: contact details, address, social profiles, delivery area, and the site search.
 */
export async function SiteJsonLd() {
  const settings = await getSettings().catch(() => null)
  const origin = siteOrigin()
  const contact = settings?.contact
  const [street, cityLine] = (contact?.address ?? '').split('\n').map((l) => l.trim())
  const sameAs = [settings?.social?.facebook, settings?.social?.instagram].filter(Boolean)
  const logo = `${origin}/brand/logo-white.png`

  const business: Record<string, unknown> = {
    '@type': ['LocalBusiness', 'Organization'],
    '@id': `${origin}/#business`,
    name: SITE_NAME,
    url: `${origin}/`,
    logo,
    image: logo,
    ...(contact?.phone ? { telephone: contact.phone } : {}),
    ...(contact?.email ? { email: contact.email } : {}),
    ...(street
      ? {
          address: {
            '@type': 'PostalAddress',
            streetAddress: street,
            ...parseCityLine(cityLine),
            addressCountry: 'US'
          }
        }
      : {}),
    ...(settings?.delivery?.areaLabel ? { areaServed: settings.delivery.areaLabel } : {}),
    ...(sameAs.length ? { sameAs } : {})
  }

  const website = {
    '@type': 'WebSite',
    '@id': `${origin}/#website`,
    name: SITE_NAME,
    url: `${origin}/`,
    publisher: { '@id': `${origin}/#business` },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${origin}/shop?q={search_term_string}` },
      'query-input': 'required name=search_term_string'
    }
  }

  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': [business, website] })
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD from site settings, with "<" escaped
      dangerouslySetInnerHTML={{ __html: json.replace(/</g, '\\u003c') }}
    />
  )
}
