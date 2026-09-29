import type { Metadata } from 'next'
import { connection } from 'next/server'
import { CheckoutForm } from '@/components/checkout/checkout-form'
import { getProfile, getUser } from '@/lib/account/session'
import { nextDeliveryDate } from '@/lib/delivery'
import { accountsEnabled } from '@/lib/supabase/env'
import { getSettings } from '@/sanity/lib/fetchers'

export const metadata: Metadata = { title: 'Checkout', robots: { index: false } }

export default async function CheckoutPage() {
  await connection()
  const [settings, user, profile] = await Promise.all([getSettings(), getUser(), getProfile()])
  const d = settings?.delivery
  return (
    <CheckoutForm
      accountsEnabled={accountsEnabled}
      customer={
        user
          ? {
              name: [profile?.first_name, profile?.last_name].filter(Boolean).join(' '),
              email: user.email,
              phone: profile?.phone ?? '',
              line1: profile?.address_line1 ?? '',
              line2: profile?.address_line2 ?? '',
              city: profile?.city ?? '',
              postalCode: profile?.postal_code ?? '',
              notes: profile?.delivery_notes ?? ''
            }
          : null
      }
      settings={{
        discountPercent: settings?.autoship?.firstOrderDiscountPercent ?? 20,
        taxRatePercent: settings?.taxRatePercent ?? 8.25,
        deliveryDate: nextDeliveryDate(d),
        pickupEnabled: d?.pickupEnabled !== false,
        pickupNote: d?.pickupNote ?? 'Your items will be available for pick up in 1 hour or less.',
        storeAddress:
          settings?.contact?.address ?? '1550 W. Horizon Ridge Pkwy, Suite N\nHenderson, NV 89012',
        allowTimeRequest: d?.allowTimeRequest !== false,
        timeWindow: {
          start: d?.timeWindow?.start ?? '08:00',
          end: d?.timeWindow?.end ?? '18:00',
          slotMinutes: d?.timeWindow?.slotMinutes ?? 30
        }
      }}
    />
  )
}
