import type { Metadata } from 'next'
import { type Crumb, ShopListing } from '@/components/shop/shop-listing'
import { getBrand, getShopProducts } from '@/sanity/lib/fetchers'

type Search = { q?: string; brand?: string; page?: string; starts_with?: string }

export async function generateMetadata({ searchParams }: PageProps<'/shop'>): Promise<Metadata> {
  const { brand } = (await searchParams) as Search
  const b = brand ? await getBrand(brand) : null
  return { title: b?.title ? `${b.title} | Shop` : 'Shop' }
}

export default async function ShopPage({ searchParams }: PageProps<'/shop'>) {
  const sp = (await searchParams) as Search
  // ?starts_with= is what the old site's search box used
  const q = (sp.q ?? sp.starts_with ?? '').slice(0, 80)
  const brandSlug = sp.brand ?? ''
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1)
  const [brand, { products, total }] = await Promise.all([
    brandSlug ? getBrand(brandSlug) : null,
    getShopProducts({ brand: brandSlug, q, page })
  ])

  const crumbs: Crumb[] = [{ label: 'Shop', href: '/shop' }]
  if (brand?.title) crumbs.push({ label: brand.title })
  if (q) crumbs.push({ label: `“${q}”` })
  const title = q ? `Results for “${q}”` : (brand?.title ?? 'Shop')

  return (
    <ShopListing
      title={title}
      crumbs={crumbs}
      products={products}
      total={total}
      page={page}
      basePath="/shop"
      query={{ q: q || undefined, brand: brandSlug || undefined }}
      activeBrand={brandSlug || undefined}
    />
  )
}
