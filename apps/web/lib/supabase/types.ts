/** Row types for supabase/migrations/*_accounts.sql (hand-written; regenerate with `supabase gen types` later). */

export type Profile = {
  id: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  delivery_notes: string | null
  stripe_customer_id: string | null
  /** False until the customer chooses a password on this site (imported accounts) */
  password_set: boolean
  created_at: string
  updated_at: string
}

export type Pet = {
  id: string
  user_id: string
  name: string
  breed: string | null
  birth_date: string | null
  created_at: string
}

export type OrderStatus =
  | 'paid'
  | 'out_for_delivery'
  | 'delivered'
  | 'ready_for_pickup'
  | 'picked_up'
  | 'cancelled'
  | 'refunded'

export type Order = {
  id: string
  number: number
  user_id: string | null
  email: string
  customer_name: string | null
  phone: string | null
  status: OrderStatus
  kind: 'order' | 'autoship_renewal'
  fulfillment: 'delivery' | 'pickup'
  delivery_date: string | null
  requested_time: string | null
  address: string | null
  notes: string | null
  autoship_schedule: string | null
  subtotal: number
  discount: number
  tax: number
  total: number
  currency: string
  stripe_checkout_session_id: string | null
  stripe_invoice_id: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  /** 'snipcart' for orders brought over from the old shop */
  source: 'site' | 'snipcart'
  legacy_id: string | null
  /** The old shop's invoice number (DF-8361), shown instead of `number` */
  legacy_number: string | null
  refunded: number
  created_at: string
}

/** An Autoship from the old shop (supabase/migrations/*_legacy_import.sql), read-only here. */
export type LegacySubscription = {
  id: string
  snipcart_id: string
  user_id: string | null
  email: string
  status: 'active' | 'paused' | 'past_due' | 'cancelled'
  title: string
  option: string | null
  product_id: string | null
  quantity: number
  unit_amount: number
  interval: 'day' | 'week' | 'month' | 'year'
  interval_count: number
  next_billing_date: string | null
  card: { brand: string; last4: string; exp_month: number; exp_year: number } | null
  started_at: string | null
  paused_at: string | null
}

export type OrderItem = {
  id: string
  order_id: string
  product_id: string | null
  variant_key: string | null
  title: string
  option: string | null
  unit_amount: number
  quantity: number
  autoship: boolean
}

export type OrderWithItems = Order & { order_items: OrderItem[] }
