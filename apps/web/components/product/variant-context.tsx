'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { sameFlavor } from '@/lib/variants'
import type { Product, ProductVariant } from './types'

type VariantContextValue = {
  variant: ProductVariant | undefined
  select: (key: string) => void
  /** The image to show for the selection: the variant's own, else one from the same flavor */
  image: ProductVariant['image'] | null
}

const VariantContext = createContext<VariantContextValue | null>(null)

const firstAvailable = (product: Product) => {
  const variants = product.variants ?? []
  return (
    variants.find((v) => v._key === product.defaultVariantKey && v.inStock !== false) ??
    variants.find((v) => v.inStock !== false) ??
    variants[0]
  )
}

/**
 * The selected variant, shared by the gallery and the buy box. `?variant=<key>` in the URL
 * preselects one (and is kept up to date), so a flavor/size can be linked to directly.
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
    const fromUrl = new URLSearchParams(window.location.search).get('variant')
    if (fromUrl && variants.some((v) => v._key === fromUrl)) setKey(fromUrl)
  }, [variants])

  const select = useCallback((next: string) => {
    setKey(next)
    const url = new URL(window.location.href)
    url.searchParams.set('variant', next)
    window.history.replaceState(window.history.state, '', url)
  }, [])

  const value = useMemo<VariantContextValue>(() => {
    const variant = variants.find((v) => v._key === key) ?? firstAvailable(product)
    const image = variant?.image?.asset
      ? variant.image
      : (variants.find((v) => variant && sameFlavor(v, variant) && v.image?.asset)?.image ?? null)
    return { variant, select, image }
  }, [variants, key, product, select])

  return <VariantContext.Provider value={value}>{children}</VariantContext.Provider>
}

export function useVariant() {
  const ctx = useContext(VariantContext)
  if (!ctx) throw new Error('useVariant must be used inside <VariantProvider>')
  return ctx
}
