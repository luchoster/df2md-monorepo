import { siteOrigin } from '@/lib/site-url'
import { getNavCategories, getSettings } from '@/sanity/lib/fetchers'
import { SITE_NAME } from '@/sanity/lib/metadata'

export const revalidate = 3600

/** A short plain-text guide to the store for crawlers and assistants: what it is and where things live. */
export async function GET() {
  const origin = siteOrigin()
  const [settings, categories] = await Promise.all([
    getSettings().catch(() => null),
    getNavCategories().catch(() => [])
  ])
  const contact = settings?.contact
  const area = settings?.delivery?.areaLabel || 'Henderson, NV'

  const lines = [
    `# ${SITE_NAME}`,
    '',
    `> ${SITE_NAME} is a locally owned online dog food store in Henderson, Nevada. It delivers dog food, treats and supplies to the door in ${area}, with next-day delivery, no delivery charge, and an optional Autoship schedule for recurring orders.`,
    '',
    '## Key pages',
    '',
    `- [Home](${origin}/): store overview and best sellers`,
    `- [Shop](${origin}/shop): the full catalog, filterable by category and brand (\`/shop?brand=<slug>\`)`,
    `- [About](${origin}/about): who runs the store`,
    `- [FAQ](${origin}/faq): delivery area, ordering and Autoship questions`,
    `- [Contact](${origin}/contact-us): store contact details`,
    `- [Weekly deals](${origin}/weekly-deals): current specials`,
    `- [Sitemap](${origin}/sitemap.xml): every product, category and page URL`,
    ''
  ]

  if (categories.length) {
    lines.push('## Categories', '')
    for (const c of categories)
      if (c.slug) lines.push(`- [${c.title}](${origin}/shop/category/${c.slug})`)
    lines.push('')
  }

  lines.push('## Policies', '')
  lines.push(`- [Return policy](${origin}/return-policy)`)
  lines.push(`- [Privacy policy](${origin}/privacy-policy)`)
  lines.push(`- [Terms and conditions](${origin}/terms-conditions)`)
  lines.push('')

  if (contact?.phone || contact?.email || contact?.address) {
    lines.push('## Contact', '')
    if (contact.phone) lines.push(`- Phone: ${contact.phone}`)
    if (contact.email) lines.push(`- Email: ${contact.email}`)
    if (contact.address) lines.push(`- Address: ${contact.address.split('\n').join(', ')}`)
    lines.push('')
  }

  return new Response(lines.join('\n'), {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'
    }
  })
}
