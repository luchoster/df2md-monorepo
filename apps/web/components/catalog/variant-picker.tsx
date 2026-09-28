'use client'

import { Info } from 'lucide-react'
import Link from 'next/link'
import { useId, useState } from 'react'
import { useCart } from '@/components/cart/cart-provider'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'
import { urlFor } from '@/sanity/lib/image'
import type { CardProduct } from './types'

/**
 * price-variation-select.js rebuilt for cards and the product page: price, size buttons,
 * Autoship toggle, Add to Cart. Differences on purpose: prices are only red when on sale,
 * out-of-stock sizes can't be added, and the Autoship schedule is chosen once in the cart
 * (one schedule per order), so the item only carries the Autoship flag.
 */
export function VariantPicker({
  product,
  size = 'card',
  showQuantity = false
}: {
  product: CardProduct
  size?: 'card' | 'page'
  showQuantity?: boolean
}) {
  const variants = product.variants ?? []
  const initial =
    variants.find((v) => v._key === product.defaultVariantKey && v.inStock !== false) ??
    variants.find((v) => v.inStock !== false) ??
    variants[0]
  const [selectedKey, setSelectedKey] = useState(initial?._key)
  const [autoship, setAutoship] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const { add } = useCart()
  const id = useId()

  const variant = variants.find((v) => v._key === selectedKey)
  if (!variant) return null
  const inStock = variant.inStock !== false
  const onSale =
    variant.compareAtPrice != null &&
    variant.price != null &&
    variant.compareAtPrice > variant.price
  const page = size === 'page'

  return (
    <div className={cn('mx-auto w-full', page ? 'max-w-[450px]' : 'max-w-[320px]')}>
      <p
        className={cn(
          'mb-2 text-center font-display font-semibold',
          page ? 'text-left text-3xl' : 'text-xl'
        )}
      >
        {!inStock ? (
          <span className="text-body">Out of Stock</span>
        ) : (
          <>
            <span className={onSale ? 'text-sale' : 'text-ink-900'}>
              {formatPrice(variant.price ?? 0)}
            </span>
            {onSale && (
              <span className="ml-2 align-middle text-base font-extralight text-body line-through md:text-lg">
                {formatPrice(variant.compareAtPrice ?? 0)}
              </span>
            )}
          </>
        )}
      </p>

      {variants.length > 1 && (
        <fieldset
          className={cn('mb-2 flex flex-wrap gap-2', page ? 'justify-start' : 'justify-center')}
        >
          <legend className="sr-only">{product.optionName ?? 'Size'}</legend>
          {variants.map((v) => (
            <button
              key={v._key}
              type="button"
              onClick={() => setSelectedKey(v._key)}
              aria-pressed={v._key === selectedKey}
              className={cn(
                'rounded-md border px-3 py-1.5 text-sm font-semibold capitalize transition-colors',
                v._key === selectedKey
                  ? 'border-secondary bg-secondary text-secondary-foreground'
                  : 'border-border bg-background text-foreground hover:border-secondary',
                v.inStock === false && 'text-subtle line-through'
              )}
            >
              {v.option}
            </button>
          ))}
        </fieldset>
      )}

      {product.autoshipEligible !== false && (
        <div
          className={cn('mt-3 flex items-center gap-2', page ? 'justify-start' : 'justify-center')}
        >
          <Checkbox
            id={`${id}-autoship`}
            checked={autoship}
            onCheckedChange={(v) => setAutoship(v === true)}
            className="size-5 border-sky data-[state=checked]:border-sky data-[state=checked]:bg-sky"
          />
          <Label
            htmlFor={`${id}-autoship`}
            className={cn('font-display font-bold text-sky', page ? 'text-2xl' : 'text-lg')}
          >
            Autoship
          </Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/faq" className="text-sky" aria-label="Learn more about Autoship">
                <Info className="size-4" />
              </Link>
            </TooltipTrigger>
            <TooltipContent>Save 20% on your first Autoship order. Learn more.</TooltipContent>
          </Tooltip>
        </div>
      )}
      {autoship && (
        <p className="mb-0 mt-1 text-center text-sm">
          Choose how often it ships in your cart. First Autoship orders save 20%.
        </p>
      )}

      <div className="mt-3 flex gap-2">
        {showQuantity && (
          <>
            <Label htmlFor={`${id}-qty`} className="sr-only">
              Quantity
            </Label>
            <Input
              id={`${id}-qty`}
              type="number"
              min={1}
              max={99}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
              className="h-11 w-16 text-center"
            />
          </>
        )}
        <Button
          size="block"
          disabled={!inStock}
          className="my-0 flex-1"
          onClick={() =>
            add(
              {
                productId: product._id,
                variantKey: variant._key,
                slug: product.slug ?? '',
                title: product.title ?? '',
                option: variant.option ?? '',
                price: variant.price ?? 0,
                imageUrl: product.mainImage?.asset
                  ? urlFor(product.mainImage as never)
                      .width(160)
                      .height(160)
                      .fit('fill')
                      .bg('ffffff')
                      .url()
                  : null,
                autoship
              },
              quantity
            )
          }
        >
          {inStock ? 'Add to Cart' : 'Out of Stock'}
        </Button>
      </div>
    </div>
  )
}
