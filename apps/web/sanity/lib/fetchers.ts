import { cache } from 'react'
import { HOME_PAGE_QUERY, PAGE_QUERY, PAGES_SLUGS_QUERY } from '../queries/page'
import { NAV_BRANDS_QUERY, NAV_CATEGORIES_QUERY, SETTINGS_QUERY } from '../queries/settings'
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
