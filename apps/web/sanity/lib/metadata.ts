import type { Metadata } from 'next'
import { getDefaultShareImage } from './fetchers'
import { urlFor } from './image'

type Meta = {
  title?: string | null
  description?: string | null
  noindex?: boolean | null
  image?: { asset?: { _id: string } | null } | null
} | null

export const SITE_NAME = 'Dog Food 2 My Door'

/** Search engines show about this much of a title and a description. */
export const TITLE_MAX = 60
export const DESCRIPTION_MAX = 160

/** Drops a trailing " - dogfood2mydoor.com" / " | example.com" style hostname from an editor title. */
export function stripHostSuffix(title: string) {
  return title.replace(/\s*[-|–—:]\s*(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+\s*$/i, '').trim()
}

/** Cuts at a word boundary so the result never exceeds `max` characters. */
export function clampTitle(title: string, max = TITLE_MAX) {
  const t = title.trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max + 1)
  const boundary = Math.max(cut.lastIndexOf(' | '), cut.lastIndexOf(' - '), cut.lastIndexOf(' '))
  return (boundary > max / 2 ? cut.slice(0, boundary) : cut.slice(0, max)).replace(
    /[\s|,:;-]+$/,
    ''
  )
}

/** Keeps whole sentences when it can, otherwise whole words with an ellipsis. */
export function clampDescription(description: string, max = DESCRIPTION_MAX) {
  const d = description.replace(/\s+/g, ' ').trim()
  if (d.length <= max) return d
  const cut = d.slice(0, max)
  const sentenceEnd = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('! '))
  if (sentenceEnd >= max / 2) return cut.slice(0, sentenceEnd + 1)
  const space = cut.lastIndexOf(' ')
  return `${cut.slice(0, space > 0 ? space : max - 1).replace(/[\s,;:]+$/, '')}…`
}

/**
 * The page title Next should render. Short titles get the layout's "| Dog Food 2 My Door"
 * template; a title that would overflow with the brand appended is used on its own, trimmed.
 */
function resolveTitle(raw: string): { title: Metadata['title']; full: string } {
  const bare = clampTitle(stripHostSuffix(raw))
  if (!bare) return { title: undefined, full: SITE_NAME }
  const withBrand = `${bare} | ${SITE_NAME}`
  if (bare.includes(SITE_NAME) || withBrand.length > TITLE_MAX)
    return { title: { absolute: bare }, full: bare }
  return { title: bare, full: withBrand }
}

type ShareImage = NonNullable<Meta>['image']

const shareImageUrl = (image: ShareImage | undefined) =>
  image?.asset
    ? urlFor(image as never)
        .width(1200)
        .height(630)
        .url()
    : undefined

/**
 * Metadata from a Sanity `meta`/`seo` object. Title and description are clamped to what search
 * results show (the on-page copy is untouched); `canonicalPath` sets the canonical URL and the
 * site's default share image fills in when the document has none.
 */
export async function buildMetadata(
  meta: Meta | undefined,
  fallbackTitle?: string | null,
  canonicalPath?: string
): Promise<Metadata> {
  const raw = meta?.title || fallbackTitle || ''
  const { title, full } = resolveTitle(raw)
  const description = meta?.description ? clampDescription(meta.description) : undefined
  const image = shareImageUrl(meta?.image) ?? shareImageUrl(await getDefaultShareImage())
  return {
    title,
    description,
    robots: meta?.noindex ? { index: false, follow: true } : undefined,
    alternates: canonicalPath ? { canonical: canonicalPath } : undefined,
    openGraph: {
      title: full,
      description,
      images: image ? [image] : undefined,
      siteName: SITE_NAME,
      type: 'website'
    }
  }
}
