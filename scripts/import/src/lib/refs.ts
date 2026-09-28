/**
 * Transform output never contains real Sanity `_id`s. Documents carry a `_legacyKey` and
 * references point at `legacy:<type>:<key>`; 03-load resolves both against the dataset
 * (existing document → its `_id`, otherwise a fresh random id), per the plan's §2 identity rule.
 */
export const legacyKey = (type: string, key: string | number) => `legacy:${type}:${key}`

export const ref = (type: string, key: string | number, extra: Record<string, unknown> = {}) => ({
  _type: 'reference',
  _ref: legacyKey(type, key),
  ...extra
})

export const isLegacyRef = (value: unknown): value is string =>
  typeof value === 'string' && value.startsWith('legacy:')

/** Product brand values that are spelled differently from their ACF choice. */
const BRAND_ALIASES: Record<string, string> = { stellaandchewy: 'stellaandchewys' }

/** Normalizes brand names so "Earth animal" matches the ACF choice "Earth Animal". */
export const brandKey = (value: string) => {
  const key = value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '')
  return BRAND_ALIASES[key] ?? key
}
