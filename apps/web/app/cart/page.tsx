import type { Metadata } from 'next'
import { connection } from 'next/server'
import { CartView } from '@/components/cart/cart-view'
import { nextDeliveryDate } from '@/lib/delivery'
import { getSettings } from '@/sanity/lib/fetchers'

export const metadata: Metadata = { title: 'Cart', robots: { index: false } }

export default async function CartPage() {
  await connection() // delivery date depends on the current time
  const settings = await getSettings()
  return (
    <CartView
      settings={{
        discountPercent: settings?.autoship?.firstOrderDiscountPercent ?? 20,
        taxRatePercent: settings?.taxRatePercent ?? 8.25,
        deliveryDate: nextDeliveryDate(settings?.delivery),
        pickupEnabled: settings?.delivery?.pickupEnabled !== false
      }}
    />
  )
}
