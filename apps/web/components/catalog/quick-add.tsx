'use client'

import { Repeat, ShoppingBag } from 'lucide-react'
import { useId, useState } from 'react'
import { useCart } from '@/components/cart/cart-provider'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from '@/components/ui/drawer'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'
import { urlFor } from '@/sanity/lib/image'
import type { CardProduct, CardVariant } from './types'

/**
 * Quick add from shadcnblocks Product Card 7: pick a size to add it (one tap), with an Autoship
 * toggle. Rendered as a hover panel on desktop and as a bottom drawer on mobile.
 */
function useQuickAdd(product: CardProduct) {
  const { add } = useCart()
  const [autoship, setAutoship] = useState(false)
  const addVariant = (v: CardVariant) =>
    add({
      productId: product._id,
      variantKey: v._key,
      slug: product.slug ?? '',
      title: product.title ?? '',
      option: v.option ?? '',
      price: v.price ?? 0,
      imageUrl: product.mainImage?.asset
        ? urlFor(product.mainImage.asset as never)
            .width(160)
            .height(160)
            .fit('fill')
            .bg('ffffff')
            .url()
        : null,
      autoship
    })
  return { autoship, setAutoship, addVariant }
}

function SizeButtons({
  variants,
  onPick,
  className
}: {
  variants: CardVariant[]
  onPick: (v: CardVariant) => void
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap justify-center gap-2', className)}>
      {variants.map((v) => {
        const out = v.inStock === false
        return (
          <Button
            key={v._key}
            type="button"
            variant="outline"
            size="sm"
            disabled={out}
            onClick={() => onPick(v)}
            className={cn('min-w-14 font-semibold', out && 'line-through')}
            aria-label={`Add ${v.option}${out ? ' (out of stock)' : ''}`}
          >
            {v.option}
          </Button>
        )
      })}
    </div>
  )
}

function AutoshipToggle({
  checked,
  onChange,
  id
}: {
  checked: boolean
  onChange: (v: boolean) => void
  id: string
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        className="data-[state=checked]:bg-sky"
      />
      <Label htmlFor={id} className="flex items-center gap-1 text-xs font-semibold text-sky">
        <Repeat className="size-3.5" /> Autoship &amp; save 20%
      </Label>
    </div>
  )
}

/** Desktop: slides up over the image on hover/focus. */
export function QuickAddPanel({ product }: { product: CardProduct }) {
  const { autoship, setAutoship, addVariant } = useQuickAdd(product)
  const id = useId()
  const variants = product.variants ?? []
  if (!variants.length) return null
  return (
    <div className="absolute inset-x-2 bottom-2 hidden translate-y-2 space-y-2.5 rounded-lg border bg-background/95 p-3 opacity-0 shadow-lg backdrop-blur transition-all duration-200 group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 lg:block">
      <p className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {variants.length > 1 ? `Quick add · ${product.optionName ?? 'Size'}` : 'Quick add'}
      </p>
      <SizeButtons variants={variants} onPick={addVariant} />
      {product.autoshipEligible !== false && (
        <AutoshipToggle id={id} checked={autoship} onChange={setAutoship} />
      )}
    </div>
  )
}

/** Mobile: bag button that opens a bottom drawer. */
export function QuickAddDrawer({ product }: { product: CardProduct }) {
  const { autoship, setAutoship, addVariant } = useQuickAdd(product)
  const [open, setOpen] = useState(false)
  const id = useId()
  const variants = product.variants ?? []
  if (!variants.length) return null
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="shrink-0 rounded-full lg:hidden"
          aria-label={`Add ${product.title} to cart`}
        >
          <ShoppingBag />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{product.title}</DrawerTitle>
          <DrawerDescription>
            Choose a {(product.optionName ?? 'size').toLowerCase()} to add it to your cart.
          </DrawerDescription>
        </DrawerHeader>
        <div className="space-y-5 px-4 pb-8">
          <div className="grid gap-2">
            {variants.map((v) => (
              <Button
                key={v._key}
                variant="outline"
                size="lg"
                disabled={v.inStock === false}
                className="justify-between"
                onClick={() => {
                  addVariant(v)
                  setOpen(false)
                }}
              >
                <span>{v.option}</span>
                <span className="font-bold">
                  {v.inStock === false ? 'Out of stock' : formatPrice(v.price ?? 0)}
                </span>
              </Button>
            ))}
          </div>
          {product.autoshipEligible !== false && (
            <AutoshipToggle id={id} checked={autoship} onChange={setAutoship} />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
