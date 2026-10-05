import type { Metadata } from 'next'
import { urlFor } from './image'

type Meta = {
  title?: string | null
  description?: string | null
  noindex?: boolean | null
  image?: { asset?: { _id: string } | null } | null
} | null

export const SITE_NAME = 'Dog Food 2 My Door'

export function buildMetadata(meta: Meta | undefined, fallbackTitle?: string | null): Metadata {
  const title = meta?.title || fallbackTitle || undefined
  const image = meta?.image?.asset
    ? urlFor(meta.image as never)
        .width(1200)
        .height(630)
        .url()
    : undefined
  return {
    title,
    description: meta?.description || undefined,
    robots: meta?.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      title,
      description: meta?.description || undefined,
      images: image ? [image] : undefined,
      siteName: SITE_NAME
    }
  }
}
