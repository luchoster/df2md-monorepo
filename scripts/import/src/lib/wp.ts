/** Shape of out/wp.json, the output of 01-extract and the input of 02-transform. */

export type WpVariant = {
  wpId: number
  status: string
  menuOrder: number
  attributes: Record<string, string>
  sku: string | null
  price: number | null
  regularPrice: number | null
  salePrice: number | null
  stockStatus: string | null
  manageStock: boolean
  stock: number | null
  weight: number | null
  length: number | null
  width: number | null
  height: number | null
  description: string | null
  thumbnailId: number | null
}

export type WpProduct = {
  wpId: number
  status: string
  title: string
  slug: string
  content: string
  excerpt: string
  date: string
  brand: string | null
  nutritionalInfo: string | null
  feedingInstructions: string | null
  ingredientsAndUse: string | null
  additionalDescriptions: string | null
  thumbnailId: number | null
  galleryIds: number[]
  /** from _product_attributes: attribute key → display name, in position order */
  attributes: { key: string; name: string; isVariation: boolean }[]
  defaultAttributes: Record<string, string>
  categoryIds: number[]
  primaryCategoryId: number | null
  tags: string[]
  featured: boolean
  seo: { title?: string; description?: string }
  variants: WpVariant[]
}

export type WpCategory = {
  termId: number
  name: string
  slug: string
  description: string
  parent: number | null
  order: number
  thumbnailId: number | null
}

export type WpBrand = { value: string; label: string }

export type WpAttachment = {
  id: number
  file: string | null
  url: string
  mime: string
  alt: string | null
  title: string
}

export type WpPage = {
  wpId: number
  title: string
  slug: string
  content: string
  date: string
  thumbnailId: number | null
  seo: { title?: string; description?: string }
}

export type WpHeroSlide = {
  imageId: number | null
  title: string
  text: string
  buttonText: string
  link: string
  textPosition: 'left' | 'right'
  textBackground: boolean
}

export type WpMenuItem = { label: string; url: string; order: number; target: string }

export type WpDump = {
  extractedAt: string
  products: WpProduct[]
  categories: WpCategory[]
  brands: WpBrand[]
  attachments: Record<string, WpAttachment>
  pages: WpPage[]
  home: { wpId: number; slides: WpHeroSlide[]; seo: { title?: string; description?: string } }
  menus: Record<string, WpMenuItem[]>
}

export type WpCustomer = {
  wpId: number
  email: string
  firstName: string | null
  lastName: string | null
  registered: string
  phone: string | null
  shipping: Record<string, string>
  pets: { name: string | null; breed: string | null; dateOfBirth: string | null }[]
}
