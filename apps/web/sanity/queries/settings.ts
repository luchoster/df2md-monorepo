import { defineQuery } from 'next-sanity'
import { linkFragment } from './shared/link'

/** Children of the linked category (`navItem`) in menu order, for the "children" dropdown. */
const navItemSubcategories = /* groq */ `
  *[_type == "category" && parent._ref == ^.link.internal._ref && showInNav != false]
    | order(order asc, title asc){ _id, title, "slug": slug.current }
`
/** Children of the referenced category (`categoryNavItem`) in menu order. */
const categoryNavItemSubcategories = /* groq */ `
  *[_type == "category" && parent._ref == ^.category._ref && showInNav != false]
    | order(order asc, title asc){ _id, title, "slug": slug.current }
`

/**
 * Every category bar item comes out in one shape, whatever its source: `label`, `dropdown`,
 * a `link` that lib/links.ts `hrefFor` resolves, `subcategories` and custom `children`.
 * `categoryNavItem` takes all of that from the referenced category document.
 */
export const SETTINGS_QUERY = defineQuery(`
  *[_id == "siteSettings"][0]{
    mainMenu[]{
      _key, _type,
      _type == "navItem" => {
        label, dropdown,
        link { ${linkFragment} },
        "subcategories": select(
          dropdown == "children" => ${navItemSubcategories}
        ),
        children[]{ _key, label, link { ${linkFragment} } }
      },
      _type == "categoryNavItem" => {
        "label": coalesce(label, category->title),
        "dropdown": select(showSubcategories != false => "children", "none"),
        "link": {
          "title": coalesce(label, category->title),
          "linkType": "internal",
          "href": null,
          "target": false,
          "buttonVariant": null,
          "internal": category->{ _type, "slug": slug.current }
        },
        "categorySlug": category->slug.current,
        "subcategories": select(
          showSubcategories != false => ${categoryNavItemSubcategories}
        ),
        "children": null
      }
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
