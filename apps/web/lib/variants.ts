/**
 * A variant is a flavor (optional) plus a size/pack, e.g. "Beef · 12 Pack". Products without
 * flavors only have the size/pack label. Shared by the product page, quick add, cart and checkout.
 */
type VariantLike = { flavor?: string | null; option?: string | null }

/** "Beef · 12 Pack", or just "12 Pack" when there are no flavors. */
export const variantLabel = (v: VariantLike) =>
  [v.flavor?.trim(), v.option?.trim()].filter(Boolean).join(' · ')

/** Flavors in the order editors listed them; empty when the product has none. */
export function flavorsOf<V extends VariantLike>(variants: V[]) {
  return [...new Set(variants.map((v) => v.flavor?.trim()).filter((f): f is string => !!f))]
}

export const sameFlavor = (a: VariantLike, b: VariantLike) =>
  (a.flavor?.trim() ?? '') === (b.flavor?.trim() ?? '')
