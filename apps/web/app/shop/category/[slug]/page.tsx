import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { type Crumb, ShopListing } from '@/components/shop/shop-listing'
import { getBrand, getCategory, getCategorySlugs, getShopProducts } from '@/sanity/lib/fetchers'
import { buildMetadata } from '@/sanity/lib/metadata'

export async function generateStaticParams() {
  return getCategorySlugs()
}

export async function generateMetadata({
  params
}: PageProps<'/shop/category/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategory(slug)
  return buildMetadata(category?.seo, category?.title)
}

export default async function CategoryPage({
  params,
  searchParams
}: PageProps<'/shop/category/[slug]'>) {
  const { slug } = await params
  const sp = (await searchParams) as { brand?: string; page?: string }
  const category = await getCategory(slug)
  if (!category) notFound()
  const brandSlug = sp.brand ?? ''
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1)
  const [brand, { products, total }] = await Promise.all([
    brandSlug ? getBrand(brandSlug) : null,
    getShopProducts({ brand: brandSlug, cats: category.ids ?? [category._id], page })
  ])

  const crumbs: Crumb[] = [{ label: 'Shop', href: '/shop' }]
  if (brand?.title) crumbs.push({ label: brand.title, href: `/shop?brand=${brandSlug}` })
  if (category.parent?.slug)
    crumbs.push({
      label: category.parent.title ?? '',
      href: `/shop/category/${category.parent.slug}`
    })
  crumbs.push({ label: category.title ?? '' })

  return (
    <ShopListing
      title={brand?.title ? `${brand.title} · ${category.title}` : (category.title ?? 'Shop')}
      crumbs={crumbs}
      products={products}
      total={total}
      page={page}
      basePath={`/shop/category/${slug}`}
      query={{ brand: brandSlug || undefined }}
      activeCategory={slug}
      activeBrand={brandSlug || undefined}
      emptyTitle="Coming Soon"
      emptyText="We don't have products in this category yet."
    />
  )
}
