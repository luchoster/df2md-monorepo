import { revalidateTag } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import { parseBody } from 'next-sanity/webhook'
import type { SanityTag } from '@/sanity/lib/fetch'

/**
 * Sanity GROQ webhook → on-demand revalidation.
 * Webhook: POST https://<site>/api/revalidate, filter `_type in ["product","category","brand","page","homePage","siteSettings"]`,
 * projection `{ "tags": [_type] }`, secret = SANITY_REVALIDATE_SECRET.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET
  if (!secret) return new Response('SANITY_REVALIDATE_SECRET is not set', { status: 500 })
  try {
    // `true` waits briefly so the Sanity CDN has the new content before Next refetches it
    const { isValidSignature, body } = await parseBody<{ tags?: SanityTag[] }>(req, secret, true)
    if (!isValidSignature) return new Response('Invalid signature', { status: 401 })
    const tags = body?.tags?.filter(Boolean) ?? []
    if (!tags.length) return new Response('Missing tags', { status: 400 })
    for (const tag of tags) revalidateTag(tag, 'max')
    return NextResponse.json({ revalidated: tags })
  } catch (error) {
    return new Response((error as Error).message, { status: 500 })
  }
}
