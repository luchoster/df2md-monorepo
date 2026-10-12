'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { sameFlavor } from '@/lib/variants'
import type { Product, ProductFlavor, ProductVariant } from './types'

type VariantContextValue = {
  variant: ProductVariant | undefined
  select: (key: string) => void
  /** The selected variant's entry in `product.flavors` (picture, nutrition, ingredients) */
  flavor: ProductFlavor | undefined
  /** The image to show for the selection: the variant's own, else its flavor's */
  image: ProductVariant['image'] | null
}

const VariantContext = createContext<VariantContextValue | null>(null)

const firstAvailable = (product: Product, flavor?: string) => {
  const variants = (product.variants ?? []).filter(
    (v) => !flavor || v.flavor?.trim().toLowerCase() === flavor.trim().toLowerCase()
  )
  return (
    variants.find((v) => v._key === product.defaultVariantKey && v.inStock !== false) ??
    variants.find((v) => v.inStock !== false) ??
    variants[0]
  )
}

/** Image for a variant: its own, else its flavor entry's, else another variant of that flavor. */
export function imageFor(product: Product, variant: ProductVariant | undefined) {
  if (!variant) return null
  if (variant.image?.asset) return variant.image
  const entry = flavorEntry(product, variant)
  if (entry?.image?.asset) return entry.image
  return (
    (product.variants ?? []).find((v) => sameFlavor(v, variant) && v.image?.asset)?.image ?? null
  )
}

export const flavorEntry = (product: Product, variant: { flavor?: string | null } | undefined) =>
  variant?.flavor
    ? product.flavors?.find((f) => f.name?.trim() === variant.flavor?.trim())
    : undefined

/**
 * The selected variant, shared by the gallery, the buy box and the tabs. `?variant=<key>` in the
 * URL preselects one (and is kept up to date), so a flavor/size can be linked to directly;
 * `?flavor=<name>` picks that flavor's first available size (old per-flavor URLs redirect here).
 */
export function VariantProvider({
  product,
  children
}: {
  product: Product
  children: React.ReactNode
}) {
  const variants = product.variants ?? []
  const [key, setKey] = useState(() => firstAvailable(product)?._key ?? '')

  // Read on the client so the product page stays static
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const fromUrl = params.get('variant')
    const flavor = params.get('flavor')
    if (fromUrl && variants.some((v) => v._key === fromUrl)) setKey(fromUrl)
    else if (flavor) {
      const match = firstAvailable(product, flavor)
      if (match?.flavor) setKey(match._key)
    }
  }, [variants, product])

  const select = useCallback((next: string) => {
    setKey(next)
    const url = new URL(window.location.href)
    url.searchParams.set('variant', next)
    window.history.replaceState(window.history.state, '', url)
  }, [])

  const value = useMemo<VariantContextValue>(() => {
    const variant = variants.find((v) => v._key === key) ?? firstAvailable(product)
    return {
      variant,
      select,
      flavor: flavorEntry(product, variant),
      image: imageFor(product, variant)
    }
  }, [variants, key, product, select])

  return <VariantContext.Provider value={value}>{children}</VariantContext.Provider>
}

export function useVariant() {
  const ctx = useContext(VariantContext)
  if (!ctx) throw new Error('useVariant must be used inside <VariantProvider>')
  return ctx
}
