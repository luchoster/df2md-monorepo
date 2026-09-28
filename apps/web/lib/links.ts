type Internal = { _type: string; slug: string | null } | null | undefined
export type LinkValue =
  | {
      title?: string | null
      linkType?: string | null
      href?: string | null
      target?: boolean | null
      buttonVariant?: string | null
      internal?: Internal
    }
  | null
  | undefined

/** Where a document lives on the storefront. */
export function pathFor(doc: Internal): string | null {
  if (!doc?.slug) return null
  switch (doc._type) {
    case 'product':
      return `/shop/${doc.slug}`
    case 'category':
      return `/shop/category/${doc.slug}`
    case 'brand':
      return `/shop?brand=${encodeURIComponent(doc.slug)}`
    case 'page':
      return `/${doc.slug}`
    default:
      return null
  }
}

export function hrefFor(link: LinkValue): string | null {
  if (!link) return null
  if (link.linkType !== 'href' && link.internal) return pathFor(link.internal)
  return link.href || pathFor(link.internal) || null
}

export const isExternal = (href: string) =>
  /^(https?:)?\/\//.test(href) || /^(mailto|tel):/.test(href)
