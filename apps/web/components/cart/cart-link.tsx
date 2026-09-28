'use client'

import { ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useCart } from './cart-provider'

export function CartLink({
  className,
  showLabel = true
}: {
  className?: string
  showLabel?: boolean
}) {
  const { count } = useCart()
  return (
    <Link
      href="/cart"
      className={cn('inline-flex items-center gap-1.5', className)}
      aria-label={`Cart, ${count} items`}
    >
      <ShoppingCart className="size-5" fill="currentColor" aria-hidden />
      {showLabel && <span>Cart</span>}
      {count > 0 && (
        <span className="grid min-w-5 place-items-center rounded-full bg-accent px-1 text-xs font-bold leading-5 text-white">
          {count}
        </span>
      )}
    </Link>
  )
}
