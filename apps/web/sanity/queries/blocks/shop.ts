import { imageFragment } from '../shared/image'
import { linkFragment } from '../shared/link'
import { productCardFragment } from '../shared/product-card'

/**
 * product-grid resolves its products in the query so the block renders without a second fetch.
 * `limit` can't be a GROQ slice parameter, so the component slices the (bounded) list.
 */
export const productGridFragment = /* groq */ `
  _type == "product-grid" => {
    _type, _key, heading, source, limit, layout, padding,
    viewAllLink { ${linkFragment} },
    "products": select(
      source == "manual" => products[]->{ ${productCardFragment} },
      source == "category" => *[_type == "product" && status == "active" && ^.category._ref in categories[]._ref]
        | order(featured desc, title asc)[0...48]{ ${productCardFragment} },
      *[_type == "product" && status == "active" && featured == true] | order(title asc)[0...48]{ ${productCardFragment} }
    )
  }
`

export const categoryGridFragment = /* groq */ `
  _type == "category-grid" => {
    _type, _key, heading, columns, padding,
    "categories": select(
      showAllTopLevel == true => *[_type == "category" && !defined(parent) && showInNav != false] | order(order asc){
        _id, title, "slug": slug.current, image { ${imageFragment} }
      },
      categories[]->{ _id, title, "slug": slug.current, image { ${imageFragment} } }
    )
  }
`

export const brandStripFragment = /* groq */ `
  _type == "brand-strip" => {
    _type, _key, heading, linkToShop, padding,
    "brands": select(
      showAll == true => *[_type == "brand" && featured == true] | order(title asc){
        _id, title, "slug": slug.current, logo { ${imageFragment} }
      },
      brands[]->{ _id, title, "slug": slug.current, logo { ${imageFragment} } }
    )
  }
`
