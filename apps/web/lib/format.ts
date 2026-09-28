const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export const formatPrice = (amount: number) => usd.format(amount)

/** "$32.99" or "$32.99 – $105.99" for a product with several sizes. */
export function formatPriceRange(prices: (number | null)[] | null | undefined): string | null {
  const list = (prices ?? []).filter((p): p is number => typeof p === 'number' && p > 0)
  if (!list.length) return null
  const min = Math.min(...list)
  const max = Math.max(...list)
  return min === max ? formatPrice(min) : `${formatPrice(min)} – ${formatPrice(max)}`
}

export const formatPhoneHref = (phone: string) =>
  `tel:+1${phone.replace(/\D/g, '').replace(/^1/, '')}`
