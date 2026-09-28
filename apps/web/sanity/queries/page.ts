import { defineQuery } from 'next-sanity'
import { blocksFragment } from './blocks'
import { metaFragment } from './shared/meta'

export const PAGE_QUERY = defineQuery(`
  *[_type == "page" && slug.current == $slug][0]{
    _id, _type, title, "slug": slug.current,
    blocks[]{ ${blocksFragment} },
    meta { ${metaFragment} }
  }
`)

export const PAGES_SLUGS_QUERY = defineQuery(`
  *[_type == "page" && defined(slug.current)]{ "slug": slug.current }
`)

export const HOME_PAGE_QUERY = defineQuery(`
  *[_id == "homePage"][0]{
    _id, _type,
    blocks[]{ ${blocksFragment} },
    meta { ${metaFragment} }
  }
`)

/** Legacy WordPress paths → current page, for middleware-free redirects in next.config. */
export const PAGE_REDIRECTS_QUERY = defineQuery(`
  *[_type == "page" && count(oldUrls) > 0]{ "slug": slug.current, oldUrls }
`)
