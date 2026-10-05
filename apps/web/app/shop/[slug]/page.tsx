import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ProductCarousel } from '@/components/catalog/product-carousel'
import type { CardProduct } from '@/components/catalog/types'
import { ProductBuyBox } from '@/components/product/product-buy-box'
import { ProductGallery } from '@/components/product/product-gallery'
import { ProductSpecs } from '@/components/product/product-specs'
import { ProductTabs } from '@/components/product/product-tabs'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'
import { formatPrice } from '@/lib/format'
import { getProduct, getProductSlugs, getSettings } from '@/sanity/lib/fetchers'
import { urlFor } from '@/sanity/lib/image'
import { buildMetadata } from '@/sanity/lib/metadata'

export async function generateStaticParams() {
  return getProductSlugs()
}

export async function generateMetadata({ params }: PageProps<'/shop/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return {}
  const meta = buildMetadata(
    {
      ...product.seo,
      description: product.seo?.description || product.shortDescription,
      image: product.seo?.image?.asset ? product.seo.image : product.mainImage
    },
    product.title
  )
  return { ...meta, alternates: { canonical: `/shop/${slug}` } }
}

export default async function ProductPage({ params }: PageProps<'/shop/[slug]'>) {
  const { slug } = await params
  const [product, settings] = await Promise.all([getProduct(slug), getSettings()])
  if (product?.status !== 'active') notFound()

  const category = product.primaryCategory ?? product.categories?.[0]
  const images = [product.mainImage, ...(product.gallery ?? [])]
  const prices = (product.variants ?? []).map((v) => v.price ?? 0).filter((p) => p > 0)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    brand: product.brand?.title ? { '@type': 'Brand', name: product.brand.title } : undefined,
    description: product.shortDescription ?? undefined,
    image: product.mainImage?.asset
      ? urlFor(product.mainImage as never)
          .width(1200)
          .url()
      : undefined,
    offers: (product.variants ?? []).map((v) => ({
      '@type': 'Offer',
      sku: v.sku ?? undefined,
      name: v.option,
      price: v.price,
      priceCurrency: 'USD',
      availability:
        v.inStock === false ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock'
    }))
  }

  return (
    <>
      <section className="container py-8 md:py-12 xl:max-w-[1400px]">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/shop">Shop</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {category?.parent?.slug && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={`/shop/category/${category.parent.slug}`}>
                      {category.parent.title}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}
            {category?.slug && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={`/shop/category/${category.slug}`}>{category.title}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="line-clamp-1">{product.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          <ProductGallery images={images} title={product.title ?? ''} />
          <div className="space-y-8">
            <div className="space-y-3">
              {product.brand?.title && (
                <Link
                  href={`/shop?brand=${product.brand.slug}`}
                  className="text-sm font-semibold uppercase tracking-wide text-muted-foreground hover:text-primary"
                >
                  {product.brand.title}
                </Link>
              )}
              <h1 className="text-3xl tracking-tight lg:text-4xl">{product.title}</h1>
              {prices.length > 1 && (
                <p className="text-sm text-muted-foreground">
                  {formatPrice(Math.min(...prices))} – {formatPrice(Math.max(...prices))} depending
                  on size
                </p>
              )}
              {product.shortDescription && (
                <p className="text-muted-foreground">{product.shortDescription}</p>
              )}
            </div>
            <ProductBuyBox
              product={product}
              discountPercent={settings?.autoship?.firstOrderDiscountPercent ?? 20}
            />
            <ProductSpecs product={product} />
          </div>
        </div>

        <div className="mt-14">
          <ProductTabs product={product} />
        </div>
      </section>

      {(product.related?.length ?? 0) > 0 && (
        <section className="border-t bg-muted/40 py-12">
          <div className="px-4 md:px-6">
            <h2 className="mb-0">You might also like</h2>
            <ProductCarousel products={product.related as CardProduct[]} />
          </div>
        </section>
      )}

      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD, built from our own data and escaped below
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
    </>
  )
}
