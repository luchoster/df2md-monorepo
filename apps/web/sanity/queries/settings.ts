import { defineQuery } from 'next-sanity'
import { linkFragment } from './shared/link'

export const SETTINGS_QUERY = defineQuery(`
  *[_id == "siteSettings"][0]{
    mainMenu[]{ _key, label, link { ${linkFragment} } },
    footerMenu[]{ _key, label, link { ${linkFragment} } },
    social,
    contact,
    deliveryZipCodes,
    deliveryAreaLabel,
    autoship,
    announcement
  }
`)

/** Two-level category tree for the header mega-menu and the shop sidebar. */
export const NAV_CATEGORIES_QUERY = defineQuery(`
  *[_type == "category" && !defined(parent) && showInNav != false] | order(order asc, title asc){
    _id, title, "slug": slug.current,
    "children": *[_type == "category" && parent._ref == ^._id && showInNav != false] | order(order asc, title asc){
      _id, title, "slug": slug.current
    }
  }
`)
