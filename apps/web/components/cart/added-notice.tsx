'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/format'
import { useCart } from './cart-provider'

/** Replaces Snipcart's "open the cart after every add" with a toast that links to the cart. */
export function AddedNotice() {
  const { lastAdded, dismissLastAdded } = useCart()
  const router = useRouter()
  useEffect(() => {
    if (!lastAdded) return
    toast.success('Added to your cart', {
      description: `${lastAdded.title} · ${lastAdded.option} · ${formatPrice(lastAdded.price)}${lastAdded.autoship ? ' · Autoship' : ''}`,
      action: { label: 'View cart', onClick: () => router.push('/cart') }
    })
    dismissLastAdded()
  }, [lastAdded, dismissLastAdded, router])
  return null
}
