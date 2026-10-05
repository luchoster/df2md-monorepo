'use client'

import { CircleCheck, CircleX, Minus, Plus, Repeat } from 'lucide-react'
import Link from 'next/link'
import { useId, useState } from 'react'
import { useCart } from '@/components/cart/cart-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'
import { urlFor } from '@/sanity/lib/image'
import type { Product } from './types'

/**
 * Buy box from shadcnblocks Product Detail 1 (price, stock badge, size radio) plus what the old
 * site's price-variation-select did: Autoship vs one-time, and Add to Cart. The Autoship
 * schedule is picked once in the cart (one schedule per order).
 */
export function ProductBuyBox({
  product,
  discountPercent = 20
}: {
  product: Product
  discountPercent?: number
}) {
  const variants = product.variants ?? []
  const initial =
    variants.find((v) => v._key === product.defaultVariantKey && v.inStock !== false) ??
    variants.find((v) => v.inStock !== false) ??
    variants[0]
  const [variantKey, setVariantKey] = useState(initial?._key ?? '')
  const [purchase, setPurchase] = useState<'once' | 'autoship'>('once')
  const [quantity, setQuantity] = useState(1)
  const { add } = useCart()
  const id = useId()

  const variant = variants.find((v) => v._key === variantKey) ?? initial
  if (!variant)
    return <p className="text-muted-foreground">This product is not available right now.</p>
  const inStock = variant.inStock !== false
  const onSale =
    variant.compareAtPrice != null &&
    variant.price != null &&
    variant.compareAtPrice > variant.price
  const price = variant.price ?? 0
  const discount = product.noDiscounts ? 0 : discountPercent
  const autoshipPrice = Math.round(price * (100 - discount)) / 100

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <span
            className={cn(
              'font-display text-3xl font-bold',
              onSale ? 'text-sale' : 'text-foreground'
            )}
          >
            {formatPrice(price)}
          </span>
          {onSale && (
            <span className="text-xl font-semibold text-muted-foreground line-through">
              {formatPrice(variant.compareAtPrice ?? 0)}
            </span>
          )}
        </div>
        {inStock ? (
          <Badge variant="secondary" className="bg-accent text-accent-foreground">
            <CircleCheck /> In stock · next-day delivery
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            <CircleX /> Out of stock
          </Badge>
        )}
      </div>

      {variants.length > 0 && (
        <fieldset className="space-y-3">
          <legend className="mb-3 text-base font-semibold text-foreground">
            {product.optionName ?? 'Size'}
          </legend>
          <RadioGroup
            value={variant._key}
            onValueChange={setVariantKey}
            className="flex flex-wrap gap-3"
          >
            {variants.map((v) => {
              const out = v.inStock === false
              return (
                <label
                  key={v._key}
                  htmlFor={`${id}-${v._key}`}
                  className="relative flex h-11 min-w-16 cursor-pointer items-center justify-center rounded-md border px-4 text-sm font-semibold transition-colors hover:bg-accent hover:text-accent-foreground has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary has-data-[state=checked]:text-primary-foreground has-focus-visible:ring-2 has-focus-visible:ring-ring has-disabled:pointer-events-none has-disabled:opacity-50"
                >
                  <RadioGroupItem
                    id={`${id}-${v._key}`}
                    value={v._key}
                    disabled={out}
                    className="sr-only"
                  />
                  <span>{v.option}</span>
                  {out && (
                    <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
                      <span className="h-px w-full rotate-12 bg-border" />
                    </span>
                  )}
                </label>
              )
            })}
          </RadioGroup>
        </fieldset>
      )}

      {product.autoshipEligible !== false && (
        <fieldset>
          <legend className="mb-3 text-base font-semibold text-foreground">
            How would you like it?
          </legend>
          <RadioGroup
            value={purchase}
            onValueChange={(v) => setPurchase(v as 'once' | 'autoship')}
            className="grid gap-3 sm:grid-cols-2"
          >
            <label
              htmlFor={`${id}-once`}
              className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 has-data-[state=checked]:border-primary has-data-[state=checked]:bg-accent/60"
            >
              <RadioGroupItem id={`${id}-once`} value="once" className="mt-0.5" />
              <span>
                <span className="block font-semibold text-foreground">One-time purchase</span>
                <span className="text-sm text-muted-foreground">{formatPrice(price)}</span>
              </span>
            </label>
            <label
              htmlFor={`${id}-autoship`}
              className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 has-data-[state=checked]:border-sky has-data-[state=checked]:bg-sky/5"
            >
              <RadioGroupItem id={`${id}-autoship`} value="autoship" className="mt-0.5" />
              <span>
                <span className="flex items-center gap-1.5 font-semibold text-sky">
                  <Repeat className="size-4" /> Autoship
                </span>
                <span className="text-sm text-muted-foreground">
                  {discount > 0
                    ? `${formatPrice(autoshipPrice)} on your first Autoship order (${discount}% off). `
                    : 'Delivered on your schedule. This brand is excluded from discounts. '}
                  <Link href="/faq" className="text-link underline-offset-2 hover:underline">
                    How it works
                  </Link>
                </span>
              </span>
            </label>
          </RadioGroup>
        </fieldset>
      )}

      <div className="flex gap-3">
        <div className="flex items-center rounded-md border">
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Decrease quantity"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
          >
            <Minus />
          </Button>
          <span className="w-8 text-center font-semibold tabular-nums" aria-live="polite">
            {quantity}
          </span>
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Increase quantity"
            onClick={() => setQuantity((q) => Math.min(99, q + 1))}
          >
            <Plus />
          </Button>
        </div>
        <Button
          size="lg"
          className="h-auto flex-1 text-base"
          disabled={!inStock}
          onClick={() =>
            add(
              {
                productId: product._id,
                variantKey: variant._key,
                slug: product.slug ?? '',
                title: product.title ?? '',
                option: variant.option ?? '',
                price,
                imageUrl: product.mainImage?.asset
                  ? urlFor(product.mainImage.asset as never)
                      .width(160)
                      .height(160)
                      .fit('fill')
                      .bg('ffffff')
                      .url()
                  : null,
                autoship: purchase === 'autoship',
                noDiscounts: !!product.noDiscounts
              },
              quantity
            )
          }
        >
          {inStock
            ? purchase === 'autoship'
              ? 'Add Autoship to Cart'
              : 'Add to Cart'
            : 'Out of Stock'}
        </Button>
      </div>
      {purchase === 'autoship' && (
        <p className="-mt-3 text-sm text-muted-foreground">
          You'll choose how often it ships in your cart. Pause or cancel anytime.
        </p>
      )}
    </div>
  )
}
