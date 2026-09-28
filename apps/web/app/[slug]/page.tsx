import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Blocks from '@/components/blocks'
import { getPage, getPageSlugs } from '@/sanity/lib/fetchers'
import { buildMetadata } from '@/sanity/lib/metadata'

export async function generateStaticParams() {
  return getPageSlugs()
}

export async function generateMetadata({ params }: PageProps<'/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const page = await getPage(slug)
  return buildMetadata(page?.meta, page?.title)
}

export default async function Page({ params }: PageProps<'/[slug]'>) {
  const { slug } = await params
  const page = await getPage(slug)
  if (!page) notFound()
  return <Blocks blocks={page.blocks} />
}
