'use client'

import { CheckCircle2, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { formatPrice } from '@/lib/format'
import { useCart } from './cart-provider'

/** Replaces Snipcart's "open the cart after every add": a small, dismissible confirmation. */
export function AddedNotice() {
  const { lastAdded, dismissLastAdded } = useCart()
  useEffect(() => {
    if (!lastAdded) return
    const t = window.setTimeout(dismissLastAdded, 6000)
    return () => window.clearTimeout(t)
  }, [lastAdded, dismissLastAdded])
  if (!lastAdded) return null
  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-start gap-3 rounded border border-line bg-white p-4 shadow-lg sm:right-4 sm:left-auto"
    >
      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand" />
      <div className="min-w-0 flex-1">
        <p className="mb-1 font-semibold text-ink-900">Added to your cart</p>
        <p className="mb-3 truncate text-sm">
          {lastAdded.title} · {lastAdded.option} · {formatPrice(lastAdded.price)}
          {lastAdded.autoship && ' · Autoship'}
        </p>
        <Link href="/cart" className={buttonVariants({ size: 'sm' })} onClick={dismissLastAdded}>
          View cart
        </Link>
      </div>
      <button
        onClick={dismissLastAdded}
        aria-label="Dismiss"
        className="text-muted hover:text-ink-900"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
