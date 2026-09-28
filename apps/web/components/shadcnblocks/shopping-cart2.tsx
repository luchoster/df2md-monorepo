'use client'

import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface CartItem {
  id: string
  name: string
  image: string
  price: number
  quantity: number
  variant?: string
}

const DEFAULT_ITEMS: CartItem[] = [
  {
    id: '1',
    name: 'Minimalist Beige Sneakers',
    image:
      'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/ecommerce/clothes/Minimalist-Beige-Sneakers-2.png',
    price: 120.0,
    quantity: 1,
    variant: 'Size: EU 36'
  },
  {
    id: '2',
    name: 'Embroidered Blue Top',
    image:
      'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/ecommerce/clothes/Woman-in-Embroidered-Blue-Top-2.png',
    price: 140.0,
    quantity: 1,
    variant: 'Size: S'
  },
  {
    id: '3',
    name: 'Classic Fedora Hat',
    image:
      'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/ecommerce/accessories/Classic-Fedora-Hat-2.png',
    price: 84.0,
    quantity: 1,
    variant: 'Color: Beige'
  }
]

const ShoppingCart2 = ({ initialItems = DEFAULT_ITEMS }: { initialItems?: CartItem[] }) => {
  const [items, setItems] = useState(initialItems)

  const updateQuantity = (id: string, delta: number) => {
    setItems(
      items
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = 9.99
  const total = subtotal + shipping

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  if (items.length === 0) {
    return (
      <section className="py-32">
        <div className="container max-w-lg text-center">
          <h1 className="mb-4 text-2xl font-semibold">Your cart is empty</h1>
          <p className="mb-8 text-muted-foreground">Looks like you haven't added anything yet.</p>
          <Button asChild>
            <a href="#">Continue Shopping</a>
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="py-32">
      <div className="container">
        <h1 className="mb-8 text-3xl font-semibold">Shopping Cart</h1>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 rounded-lg border bg-card p-4">
                  <div className="w-24 shrink-0">
                    <AspectRatio ratio={1} className="overflow-hidden rounded-md bg-muted">
                      <img src={item.image} alt={item.name} className="size-full object-cover" />
                    </AspectRatio>
                  </div>

                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <h3 className="font-medium">{item.name}</h3>
                      {item.variant && (
                        <p className="text-sm text-muted-foreground">{item.variant}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        <Minus className="size-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        <Plus className="size-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <div className="text-right">
                      <p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(item.price)} each
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="mr-1 size-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="rounded-lg border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold">Order Summary</h2>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <ShoppingCart className="size-4" />
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{formatPrice(shipping)}</span>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <Button size="lg" className="mt-6 w-full">
                Proceed to Checkout
              </Button>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                Taxes calculated at checkout
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export { ShoppingCart2 }
