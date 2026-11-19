import 'server-only'
import type { RecentOrder } from '@/lib/checkout/schema'
import { createAdminClient } from '@/lib/supabase/server'

/** How far back checkout looks for an order with the same items from the same customer. */
export const RECENT_ORDER_HOURS = 24

type CartLine = { productId: string; variantKey: string; quantity: number }

const lineKey = (l: { productId: string | null; variantKey: string | null; quantity: number }) =>
  `${l.productId ?? ''}:${l.variantKey ?? ''}:${l.quantity}`

/**
 * The customer's most recent paid order from the last day whose items match the cart exactly
 * (same products, sizes and quantities). Checkout shows it as a warning, so a customer who
 * closed the tab before the thank-you page, or forgot they already ordered, doesn't pay twice.
 * Matched by the typed email and, when signed in, the account. Never throws: a failed lookup
 * just means no warning.
 */
export async function findRecentMatchingOrder({
  emails,
  userId,
  items
}: {
  emails: string[]
  userId?: string | null
  items: CartLine[]
}): Promise<RecentOrder | null> {
  const db = createAdminClient()
  const addresses = [...new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean))]
  if (!db || !items.length || (!addresses.length && !userId)) return null
  const who = [
    ...addresses.map((e) => `email.ilike.${JSON.stringify(e)}`),
    ...(userId ? [`user_id.eq.${userId}`] : [])
  ].join(',')
  const since = new Date(Date.now() - RECENT_ORDER_HOURS * 3600_000).toISOString()
  try {
    const { data, error } = await db
      .from('orders')
      .select('number, created_at, total, order_items(product_id, variant_key, quantity)')
      .eq('kind', 'order')
      .gte('created_at', since)
      .or(who)
      .order('created_at', { ascending: false })
      .limit(10)
    if (error) throw error

    const want = items.map(lineKey).sort().join('|')
    const match = (data ?? []).find((o) => {
      const lines = (o.order_items ?? []) as {
        product_id: string | null
        variant_key: string | null
        quantity: number
      }[]
      const have = lines
        .map((l) =>
          lineKey({ productId: l.product_id, variantKey: l.variant_key, quantity: l.quantity })
        )
        .sort()
        .join('|')
      return have === want
    })
    return match
      ? {
          number: match.number as number,
          placedAt: match.created_at as string,
          total: match.total as number
        }
      : null
  } catch (error) {
    console.error('recent order check failed', error)
    return null
  }
}
