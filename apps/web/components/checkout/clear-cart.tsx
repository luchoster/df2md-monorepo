'use client'

import { useEffect } from 'react'
import { useCart } from '@/components/cart/cart-provider'

/** Empties the cart once the order is confirmed. */
export function ClearCart() {
  const { ready, clear } = useCart()
  useEffect(() => {
    if (ready) clear()
  }, [ready, clear])
  return null
}
