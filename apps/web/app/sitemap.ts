import type { MetadataRoute } from 'next'
import { siteOrigin } from '@/lib/site-url'
import { getSitemapEntries } from '@/sanity/lib/fetchers'

/** Pages that exist but are only reached after an action, not from search. */
const hiddenPages = new Set(['thank-you'])

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin()
  const url = (path: string) => `${origin}${path}`
  const data = await getSitemapEntries().catch(() => null)
  const stamp = (d?: string | null) => (d ? new Date(d) : undefined)

  const entries: MetadataRoute.Sitemap = [
    { url: url('/'), changeFrequency: 'daily', priority: 1 },
    { url: url('/shop'), changeFrequency: 'daily', priority: 0.9 }
  ]
  for (const p of data?.pages ?? [])
    if (p.slug && !hiddenPages.has(p.slug))
      entries.push({ url: url(`/${p.slug}`), lastModified: stamp(p._updatedAt), priority: 0.6 })
  for (const c of data?.categories ?? [])
    if (c.slug)
      entries.push({
        url: url(`/shop/category/${c.slug}`),
        lastModified: stamp(c._updatedAt),
        changeFrequency: 'weekly',
        priority: 0.7
      })
  for (const b of data?.brands ?? [])
    if (b.slug)
      entries.push({
        url: url(`/shop?brand=${encodeURIComponent(b.slug)}`),
        lastModified: stamp(b._updatedAt),
        changeFrequency: 'weekly',
        priority: 0.5
      })
  for (const p of data?.products ?? [])
    if (p.slug)
      entries.push({
        url: url(`/shop/${p.slug}`),
        lastModified: stamp(p._updatedAt),
        changeFrequency: 'weekly',
        priority: 0.8
      })
  return entries
}
