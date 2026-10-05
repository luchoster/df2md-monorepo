import { defineQuery } from 'next-sanity'
import { linkFragment } from './shared/link'

export const SETTINGS_QUERY = defineQuery(`
  *[_id == "siteSettings"][0]{
    mainMenu[]{
      _key, label, dropdown,
      link { ${linkFragment} },
      "subcategories": select(
        dropdown == "children" => *[_type == "category" && parent._ref == ^.link.internal._ref && showInNav != false]
          | order(order asc, title asc){ _id, title, "slug": slug.current }
      ),
      children[]{ _key, label, link { ${linkFragment} } }
    },
    footerColumns[]{ _key, title, links[]{ _key, label, link { ${linkFragment} } } },
    legalLinks[]{ _key, label, link { ${linkFragment} } },
    social,
    contact,
    announcement{ active, text, button { ${linkFragment} } },
    delivery,
    autoship,
    taxRatePercent
  }
`)

/** Brands that have something to sell, for the "Shop by Brand" mega-menu and the shop filter. */
export const NAV_BRANDS_QUERY = defineQuery(`
  *[_type == "brand" && count(*[_type == "product" && status == "active" && references(^._id)]) > 0]
    | order(lower(title) asc){ _id, title, "slug": slug.current }
`)

/** Two-level category tree for the mobile menu and the shop sidebar. */
export const NAV_CATEGORIES_QUERY = defineQuery(`
  *[_type == "category" && !defined(parent) && showInNav != false] | order(order asc, title asc){
    _id, title, "slug": slug.current,
    "children": *[_type == "category" && parent._ref == ^._id && showInNav != false] | order(order asc, title asc){
      _id, title, "slug": slug.current
    }
  }
`)
