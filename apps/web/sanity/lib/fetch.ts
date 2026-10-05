import type { QueryParams } from 'next-sanity'
import { client } from './client'

/**
 * Cache tags. A Sanity webhook posts `{ tags: [_type] }` to /api/revalidate, so every query
 * is tagged with the document types it reads.
 */
export type SanityTag = 'product' | 'category' | 'brand' | 'page' | 'homePage' | 'siteSettings'

/**
 * Thin wrapper over client.fetch with Next's data cache: time-based revalidation as a safety net,
 * tags for on-demand revalidation (same approach as gnar: no defineLive until Visual Editing).
 */
export async function sanityFetch<const Q extends string>({
  query,
  params = {},
  tags,
  revalidate = 60
}: {
  query: Q
  params?: QueryParams
  tags: SanityTag[]
  revalidate?: number | false
}) {
  return client.fetch(query, params, { next: { revalidate, tags } })
}
