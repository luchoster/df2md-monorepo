import 'server-only'
import { defineQuery } from 'next-sanity'
import { nextDeliveryDate } from '@/lib/delivery'
import { computeTotals } from '@/lib/pricing'
import { client } from '@/sanity/lib/client'
import { SETTINGS_QUERY } from '@/sanity/queries/settings'
import type { CheckoutLine, CheckoutQuote, CheckoutRequest } from './schema'

const CHECKOUT_PRODUCTS_QUERY = defineQuery(`
  *[_type == "product" && _id in $ids]{
    _id, title, status, autoshipEligible, noDiscounts,
    variants[]{ _key, option, price, inStock }
  }
`)

/**
 * Re-prices a cart from Sanity (fresh, no CDN) so nothing the browser sends can change an amount.
 * Returns the problems it found (removed products, out of stock, not Autoship-able) instead of
 * silently fixing them, so the shopper sees what changed.
 */
export async function quoteCart(
  req: CheckoutRequest,
  { firstAutoship }: { firstAutoship: boolean }
) {
  const fresh = client.withConfig({ useCdn: false })
  const ids = [...new Set(req.items.map((i) => i.productId))]
  const [products, settings] = await Promise.all([
    fresh.fetch(CHECKOUT_PRODUCTS_QUERY, { ids }),
    fresh.fetch(SETTINGS_QUERY)
  ])
  const problems: string[] = []
  const lines: CheckoutLine[] = []
  for (const item of req.items) {
    const product = products.find((p) => p._id === item.productId)
    const variant = product?.variants?.find((v) => v._key === item.variantKey)
    const name = product?.title ?? 'An item'
    if (product?.status !== 'active' || !variant?.price) {
      problems.push(`${name} is no longer available.`)
      continue
    }
    if (variant.inStock === false) {
      problems.push(`${name} (${variant.option}) is out of stock.`)
      continue
    }
    if (item.autoship && product.autoshipEligible === false) {
      problems.push(`${name} can't be ordered on Autoship.`)
      continue
    }
    lines.push({
      productId: product._id,
      variantKey: variant._key,
      title: product.title ?? 'Product',
      option: variant.option ?? '',
      unitAmount: Math.round(variant.price * 100),
      quantity: item.quantity,
      autoship: item.autoship,
      noDiscounts: !!product.noDiscounts
    })
  }
  const discountPercent = settings?.autoship?.firstOrderDiscountPercent ?? 20
  const taxRatePercent = settings?.taxRatePercent ?? 8.25
  const totals = computeTotals(lines, { discountPercent, taxRatePercent, firstAutoship })
  const quote: CheckoutQuote = {
    lines,
    ...totals,
    discountPercent,
    taxRatePercent,
    deliveryDate: nextDeliveryDate(settings?.delivery),
    firstAutoship
  }
  return { quote, problems, settings }
}
