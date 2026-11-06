import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Blocks from '@/components/blocks'
import { getPage, getPageSlugs } from '@/sanity/lib/fetchers'
import { buildMetadata } from '@/sanity/lib/metadata'

export async function generateStaticParams() {
  return getPageSlugs()
}

/**
 * CMS page slugs are plain kebab-case. Anything else (robots.txt, sitemap.xml, favicon.ico, …)
 * is a file request that should 404 without a Sanity query.
 */
const isPageSlug = (slug: string) => /^[a-z0-9][a-z0-9-]*$/i.test(slug)

export async function generateMetadata({ params }: PageProps<'/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  if (!isPageSlug(slug)) return {}
  const page = await getPage(slug)
  return buildMetadata(page?.meta, page?.title)
}

export default async function Page({ params }: PageProps<'/[slug]'>) {
  const { slug } = await params
  if (!isPageSlug(slug)) notFound()
  const page = await getPage(slug)
  if (!page) notFound()
  return <Blocks blocks={page.blocks} />
}
