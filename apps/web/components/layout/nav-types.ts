import type {
  NAV_BRANDS_QUERY_RESULT,
  NAV_CATEGORIES_QUERY_RESULT,
  SETTINGS_QUERY_RESULT
} from '@/sanity.types'

export type Settings = NonNullable<SETTINGS_QUERY_RESULT>
export type NavItem = NonNullable<Settings['mainMenu']>[number]
export type NavBrand = NAV_BRANDS_QUERY_RESULT[number]
export type NavCategory = NAV_CATEGORIES_QUERY_RESULT[number]

export type DropdownLink = { key: string; label: string; href: string }

/** The links a nav item's dropdown shows, whatever its source. */
export function dropdownLinks(
  item: NavItem,
  brands: NavBrand[],
  href: (l: NavItem['link']) => string | null
): DropdownLink[] {
  switch (item.dropdown) {
    case 'brands':
      return brands.map((b) => ({
        key: b._id,
        label: b.title ?? '',
        href: `/shop?brand=${b.slug}`
      }))
    case 'children':
      return (item.subcategories ?? []).map((c) => ({
        key: c._id,
        label: c.title ?? '',
        href: `/shop/category/${c.slug}`
      }))
    case 'custom':
      return (item.children ?? []).flatMap((c) => {
        const h = href(c.link)
        return h ? [{ key: c._key, label: c.label ?? '', href: h }] : []
      })
    default:
      return []
  }
}
