import type { Metadata } from 'next'
import Blocks from '@/components/blocks'
import { getHomePage } from '@/sanity/lib/fetchers'
import { buildMetadata } from '@/sanity/lib/metadata'

export async function generateMetadata(): Promise<Metadata> {
  const home = await getHomePage()
  return buildMetadata(home?.meta)
}

export default async function HomePage() {
  const home = await getHomePage()
  return <Blocks blocks={home?.blocks} />
}
