/**
 * Design tokens exposed to editors. Values are the Tailwind 4 `--color-*` names declared in
 * apps/web/app/globals.css, so a block's `background` maps 1:1 to a `bg-<token>` class.
 */
export const BACKGROUND_COLORS = [
  { title: 'None (white)', value: 'white' },
  { title: 'Light surface', value: 'surface' },
  { title: 'Brand green', value: 'brand' },
  { title: 'Light green', value: 'brand-light' },
  { title: 'Lime', value: 'brand-lime' },
  { title: 'Navy', value: 'navy' },
  { title: 'Sky blue', value: 'sky' },
  { title: 'Band blue', value: 'sky-band' },
  { title: 'Teal', value: 'teal' },
  { title: 'Ink (dark blue)', value: 'ink' },
  { title: 'Orange', value: 'accent' },
  { title: 'Yellow', value: 'sun' },
  { title: 'Soft yellow', value: 'sun-soft' }
]

export const BUTTON_VARIANTS = [
  { title: 'Primary (green)', value: 'default' },
  { title: 'Secondary (navy)', value: 'secondary' },
  { title: 'Dark green', value: 'dark' },
  { title: 'Outline', value: 'outline' },
  { title: 'Link', value: 'link' }
]

/** Documents that exist exactly once, with a fixed `_id`. */
export const SINGLETONS = ['homePage', 'siteSettings'] as const

export const API_VERSION = '2026-09-01'
