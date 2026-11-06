import { defineQuery } from 'next-sanity'

/** Every public URL the sitemap lists, with the date each document last changed. */
export const SITEMAP_QUERY = defineQuery(`{
  "pages": *[_type == "page" && defined(slug.current) && meta.noindex != true]{
    "slug": slug.current, _updatedAt
  },
  "products": *[_type == "product" && status == "active" && defined(slug.current)
    && seo.noindex != true]{ "slug": slug.current, _updatedAt },
  "categories": *[_type == "category" && defined(slug.current) && seo.noindex != true]{
    "slug": slug.current, _updatedAt
  },
  "brands": *[_type == "brand" && defined(slug.current)
    && count(*[_type == "product" && status == "active" && references(^._id)]) > 0]{
    "slug": slug.current, _updatedAt
  }
}`)
