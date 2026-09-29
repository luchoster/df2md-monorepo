import { Package } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { OrderCard } from '@/components/account/order-card'
import { SearchableList } from '@/components/account/searchable-list'
import { Button } from '@/components/ui/button'
import { getOrders } from '@/lib/account/data'
import { formatDate, STATUS } from '@/lib/account/format'
import { requireUser } from '@/lib/account/session'
import { getProductThumbs } from '@/sanity/lib/fetchers'

export const metadata: Metadata = { title: 'Orders' }

export default async function OrdersPage() {
  await requireUser('/account/orders')
  const orders = await getOrders()
  const thumbs = await getProductThumbs(
    orders.flatMap((o) => o.order_items.map((i) => i.product_id ?? ''))
  )
  return (
    <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
      <div>
        <h2 className="text-xl tracking-tight md:text-2xl">Orders</h2>
        <p className="text-sm text-muted-foreground">
          Your deliveries, pick ups and Autoship orders.
        </p>
      </div>
      {orders.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed px-6 py-14 text-center sm:col-span-2">
          <span className="mb-4 grid size-14 place-items-center rounded-full bg-muted">
            <Package className="size-7 text-muted-foreground" aria-hidden />
          </span>
          <p className="font-semibold">No orders yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Orders you place with this email address show up here.
          </p>
          <Button asChild className="mt-5">
            <Link href="/shop">Start shopping</Link>
          </Button>
        </div>
      ) : (
        <SearchableList
          label="Search orders"
          items={orders.map((order) => ({
            key: order.id,
            text: [
              order.number,
              formatDate(order.created_at),
              STATUS[order.status].label,
              ...order.order_items.map((i) => `${i.title} ${i.option ?? ''}`)
            ].join(' '),
            node: <OrderCard order={order} thumbs={thumbs} />
          }))}
          empty={(query) => (
            <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              No orders match “{query}”.
            </p>
          )}
        />
      )}
    </div>
  )
}
