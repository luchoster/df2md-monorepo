import { cache } from 'react'
import type { CardProduct } from '@/components/catalog/types'
import { HOME_PAGE_QUERY, PAGE_QUERY, PAGES_SLUGS_QUERY } from '../queries/page'
import { NAV_BRANDS_QUERY, NAV_CATEGORIES_QUERY, SETTINGS_QUERY } from '../queries/settings'
import {
  BRAND_BY_SLUG_QUERY,
  CATEGORY_BY_SLUG_QUERY,
  CATEGORY_SLUGS_QUERY,
  SHOP_COUNT_QUERY,
  shopProductsQuery
} from '../queries/shop'
import { client } from './client'
import { sanityFetch } from './fetch'

// React cache(): metadata and page share one request per render.
export const getSettings = cache(() =>
  sanityFetch({ query: SETTINGS_QUERY, tags: ['siteSettings'] })
)

export const getNavCategories = cache(() =>
  sanityFetch({ query: NAV_CATEGORIES_QUERY, tags: ['category'], revalidate: 300 })
)

export const getNavBrands = cache(() =>
  sanityFetch({ query: NAV_BRANDS_QUERY, tags: ['brand', 'product'], revalidate: 300 })
)

export const getHomePage = cache(() =>
  sanityFetch({ query: HOME_PAGE_QUERY, tags: ['homePage', 'product', 'category', 'brand'] })
)

export const getPage = cache((slug: string) =>
  sanityFetch({
    query: PAGE_QUERY,
    params: { slug },
    tags: ['page', 'product', 'category', 'brand']
  })
)

export const getPageSlugs = () => client.withConfig({ useCdn: false }).fetch(PAGES_SLUGS_QUERY)

export type ShopFilters = { brand?: string; cats?: string[]; q?: string; page?: number }

/** One page of products plus the total, for /shop and category pages. */
export async function getShopProducts({ brand = '', cats = [], q = '', page = 1 }: ShopFilters) {
  // `match` wants whole words; add a trailing wildcard so "acan" finds "Acana"
  const term = q.trim() ? `${q.trim().replace(/[*"]/g, '')}*` : ''
  const params = { brand, cats, q: term }
  const tags = ['product', 'brand', 'category'] as const
  const [products, total] = await Promise.all([
    client.fetch<CardProduct[]>(shopProductsQuery(page), params, {
      next: { revalidate: 300, tags: [...tags] }
    }),
    sanityFetch({ query: SHOP_COUNT_QUERY, params, tags: [...tags], revalidate: 300 })
  ])
  return { products, total }
}

export const getCategory = cache((slug: string) =>
  sanityFetch({
    query: CATEGORY_BY_SLUG_QUERY,
    params: { slug },
    tags: ['category'],
    revalidate: 300
  })
)

export const getBrand = cache((slug: string) =>
  sanityFetch({ query: BRAND_BY_SLUG_QUERY, params: { slug }, tags: ['brand'], revalidate: 300 })
)

export const getCategorySlugs = () =>
  client.withConfig({ useCdn: false }).fetch(CATEGORY_SLUGS_QUERY)
