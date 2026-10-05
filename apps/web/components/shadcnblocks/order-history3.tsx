'use client'

import { CheckCircle, Clock, Search, Truck, XCircle } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
type OrderStatus = 'pending' | 'shipped' | 'delivered' | 'cancelled'

interface OrderItem {
  name: string
  variant: string
  image: string
  price: number
  quantity: number
  status: OrderStatus
  statusDate: string
}

interface Order {
  id: string
  orderNumber: string
  orderDate: string
  total: number
  items: OrderItem[]
}

const DEFAULT_ORDERS: Order[] = [
  {
    id: '1',
    orderNumber: '47582',
    orderDate: '15 January 2025',
    total: 487.0,
    items: [
      {
        name: 'Mid-Century Lounge Chair',
        variant: 'Mustard Yellow',
        image:
          'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/ecommerce/furniture/Modern-Leather-Sofa-1.png',
        price: 289.0,
        quantity: 1,
        status: 'delivered',
        statusDate: '22 January 2025'
      },
      {
        name: 'Floral Throw Pillow',
        variant: 'Dark Botanical Print',
        image:
          'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/ecommerce/furniture/Minimalist-Loveseat-1.png',
        price: 49.0,
        quantity: 2,
        status: 'delivered',
        statusDate: '22 January 2025'
      },
      {
        name: 'Indoor Plant with Pot',
        variant: 'Medium Green',
        image:
          'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/ecommerce/furniture/Minimalist-Wooden-Sideboard-1.png',
        price: 99.0,
        quantity: 1,
        status: 'delivered',
        statusDate: '18 January 2025'
      }
    ]
  },
  {
    id: '2',
    orderNumber: '46321',
    orderDate: '10 January 2025',
    total: 329.0,
    items: [
      {
        name: 'Wooden Coffee Table',
        variant: 'Natural Oak',
        image:
          'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/ecommerce/furniture/Modern-Wooden-Cabinet-1.png',
        price: 249.0,
        quantity: 1,
        status: 'delivered',
        statusDate: '13 January 2025'
      },
      {
        name: 'Woven Wall Tapestry Set',
        variant: 'Geometric Pattern',
        image:
          'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/ecommerce/furniture/Modern-Artistic-Lamp-1.png',
        price: 80.0,
        quantity: 1,
        status: 'delivered',
        statusDate: '13 January 2025'
      }
    ]
  },
  {
    id: '3',
    orderNumber: '45890',
    orderDate: '28 December 2024',
    total: 159.0,
    items: [
      {
        name: 'Ceramic Table Lamp',
        variant: 'Matte White',
        image:
          'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/ecommerce/furniture/Modern-Artistic-Lamp-2.png',
        price: 159.0,
        quantity: 1,
        status: 'shipped',
        statusDate: '5 January 2025'
      }
    ]
  }
]

const statusConfig: Record<
  OrderStatus,
  { label: string; className: string; icon: typeof CheckCircle }
> = {
  pending: {
    label: 'Processing',
    className: 'text-slate-600',
    icon: Clock
  },
  shipped: {
    label: 'Shipped on',
    className: 'text-blue-600',
    icon: Truck
  },
  delivered: {
    label: 'Delivered on',
    className: 'text-emerald-600',
    icon: CheckCircle
  },
  cancelled: {
    label: 'Cancelled on',
    className: 'text-red-600',
    icon: XCircle
  }
}

interface OrderHistory3Props {
  orders?: Order[]
  className?: string
}

const OrderHistory3 = ({ orders = DEFAULT_ORDERS, className }: OrderHistory3Props) => {
  const [searchQuery, setSearchQuery] = useState('')

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  const filteredOrders = orders.filter((order) => {
    if (searchQuery === '') return true
    const query = searchQuery.toLowerCase()
    return (
      order.orderNumber.includes(query) ||
      order.items.some((item) => item.name.toLowerCase().includes(query))
    )
  })

  return (
    <section className={cn('py-16 md:py-24', className)}>
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">My Orders</h1>
            <p className="mt-1 text-muted-foreground">
              View your order history and tracking details
            </p>
          </div>

          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 sm:w-56"
            />
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="gap-0 overflow-hidden p-0 shadow-none">
              {/* Order Header */}
              <CardHeader className="bg-muted/40 px-4 py-3 md:px-6 md:py-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="grid grid-cols-3 gap-4 sm:flex sm:gap-8">
                    <div>
                      <p className="text-xs text-muted-foreground">Order Number</p>
                      <p className="font-semibold">{order.orderNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Order Date</p>
                      <p className="font-medium">{order.orderDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Amount</p>
                      <p className="font-semibold">{formatPrice(order.total)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      View Invoice
                    </Button>
                    <Button variant="outline" size="sm">
                      Archive
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Order Items */}
              <CardContent className="p-0">
                {order.items.map((item, index) => {
                  const status = statusConfig[item.status]
                  const StatusIcon = status.icon

                  return (
                    <div key={index}>
                      {index > 0 && <Separator />}
                      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between md:p-6">
                        {/* Left: Product Info */}
                        <div className="flex gap-4">
                          <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted md:size-20">
                            <AspectRatio ratio={1}>
                              <img
                                src={item.image}
                                alt={item.name}
                                className="size-full object-cover"
                              />
                            </AspectRatio>
                          </div>
                          <div>
                            <h3 className="font-medium">{item.name}</h3>
                            <p className="text-sm text-muted-foreground">{item.variant}</p>
                            <Button variant="outline" size="sm" className="mt-2">
                              Buy Again
                            </Button>
                          </div>
                        </div>

                        {/* Right: Status */}
                        <div className="flex items-center gap-2 sm:text-right">
                          <StatusIcon
                            className={cn(
                              'size-5 shrink-0',
                              item.status === 'delivered' && 'text-emerald-500',
                              item.status === 'shipped' && 'text-blue-500',
                              item.status === 'pending' && 'text-slate-400',
                              item.status === 'cancelled' && 'text-red-500'
                            )}
                            fill={item.status === 'delivered' ? 'currentColor' : 'none'}
                            strokeWidth={item.status === 'delivered' ? 0 : 2}
                          />
                          <p className="text-sm">
                            <span className="text-muted-foreground">{status.label} </span>
                            <span className="font-medium">{item.statusDate}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          ))}

          {/* Empty State */}
          {filteredOrders.length === 0 && (
            <Card className="shadow-none">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                  <Search className="size-8 text-muted-foreground" />
                </div>
                <h2 className="mb-2 text-lg font-semibold">No orders found</h2>
                <p className="max-w-sm text-sm text-muted-foreground">
                  No orders matching &quot;{searchQuery}&quot;
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  )
}

export { OrderHistory3 }
