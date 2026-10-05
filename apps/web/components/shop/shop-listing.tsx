import { SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'
import { ProductCard } from '@/components/catalog/product-card'
import type { CardProduct } from '@/components/catalog/types'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { getNavBrands, getNavCategories, getSettings } from '@/sanity/lib/fetchers'
import { SHOP_PAGE_SIZE } from '@/sanity/queries/shop'
import { ShopPagination } from './shop-pagination'
import { ShopSidebar } from './shop-sidebar'

export type Crumb = { label: string; href?: string }

export async function ShopListing({
  title,
  crumbs,
  products,
  total,
  page,
  basePath,
  query,
  activeCategory,
  activeBrand,
  emptyTitle = 'There were no results for your search…',
  emptyText = 'Please try with a different keyword.'
}: {
  title: string
  crumbs: Crumb[]
  products: CardProduct[]
  total: number
  page: number
  basePath: string
  query: Record<string, string | undefined>
  activeCategory?: string
  activeBrand?: string
  emptyTitle?: string
  emptyText?: string
}) {
  const [categories, brands, settings] = await Promise.all([
    getNavCategories(),
    getNavBrands(),
    getSettings()
  ])
  const pages = Math.ceil(total / SHOP_PAGE_SIZE)
  const hrefFor = (p: number) => {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(query)) if (v) params.set(k, v)
    if (p > 1) params.set('page', String(p))
    const qs = params.toString()
    return qs ? `${basePath}?${qs}` : basePath
  }
  const sidebar = (
    <ShopSidebar
      categories={categories}
      brands={brands}
      activeCategory={activeCategory}
      activeBrand={activeBrand}
      email={settings?.contact?.email}
    />
  )

  return (
    <div className="container py-10 md:py-14 xl:max-w-[1400px]">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          {crumbs.map((c, i) => (
            <span key={c.label} className="contents">
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {c.href && i < crumbs.length - 1 ? (
                  <BreadcrumbLink asChild>
                    <Link href={c.href}>{c.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{c.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </span>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-1">{title}</h1>
          <p className="text-muted-foreground">
            {total} {total === 1 ? 'product' : 'products'}
          </p>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="lg:hidden">
              <SlidersHorizontal /> Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[min(85vw,360px)] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-6">{sidebar}</div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
        <div className="hidden lg:block">{sidebar}</div>
        <div>
          {products.length ? (
            <ul className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 md:gap-x-4 xl:grid-cols-4">
              {products.map((p) => (
                <li key={p._id}>
                  <ProductCard product={p} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-xl border bg-muted/50 px-6 py-16 text-center">
              <h2 className="mb-2 text-2xl">{emptyTitle}</h2>
              <p className="mb-6 text-muted-foreground">{emptyText}</p>
              <Button asChild>
                <Link href="/shop">Browse all products</Link>
              </Button>
            </div>
          )}
          <ShopPagination page={page} pages={pages} hrefFor={hrefFor} />
        </div>
      </div>
    </div>
  )
}
