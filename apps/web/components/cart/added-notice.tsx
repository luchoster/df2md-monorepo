'use client'

import { CircleCheck, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/format'
import { type CartItem, useCart } from './cart-provider'

/**
 * Replaces Snipcart's "open the cart after every add" with a card that confirms the add (photo,
 * option, price) and links to the cart. Position comes from the app's Toaster: top of the screen
 * on phones, bottom-right on desktop.
 */
export function AddedNotice() {
  const { lastAdded, dismissLastAdded } = useCart()
  useEffect(() => {
    if (!lastAdded) return
    const item = lastAdded
    toast.custom((id) => <AddedCard item={item} onClose={() => toast.dismiss(id)} />, {
      duration: 5000
    })
    dismissLastAdded()
  }, [lastAdded, dismissLastAdded])
  return null
}

function AddedCard({ item, onClose }: { item: CartItem; onClose: () => void }) {
  return (
    <div
      role="status"
      className="flex w-full items-center gap-3 rounded-xl border bg-popover p-3 text-popover-foreground shadow-lg sm:w-[360px]"
    >
      {item.imageUrl ? (
        <Image
          src={item.imageUrl}
          alt=""
          width={56}
          height={56}
          className="size-14 shrink-0 rounded-md border bg-white object-cover"
        />
      ) : (
        <CircleCheck className="size-8 shrink-0 text-primary" aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-sm font-bold">
          <CircleCheck className="size-4 shrink-0 text-primary" aria-hidden /> Added to your cart
        </p>
        <p className="truncate text-sm">{item.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {item.option} · {formatPrice(item.price)}
          {item.autoship ? ' · Autoship' : ''}
        </p>
      </div>
      <Button asChild size="sm" className="shrink-0" onClick={onClose}>
        <Link href="/cart">View cart</Link>
      </Button>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
        className="-mr-1 shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
