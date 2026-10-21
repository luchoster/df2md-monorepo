import 'server-only'
import { renderNewOrderEmail } from '@df2md/emails'
import { formatDeliveryDate, formatSlot } from '@/lib/delivery'
import { formatPhone } from '@/lib/format'
import { siteOrigin } from '@/lib/site-url'
import { createAdminClient } from '@/lib/supabase/server'
import type { OrderWithItems } from '@/lib/supabase/types'
import { getSettings } from '@/sanity/lib/fetchers'

/** The store's copy of every paid order and Autoship renewal. */
const STORE_EMAIL = process.env.ORDER_NOTIFICATION_EMAIL || 'info@dogfood2mydoor.com'
const FROM = process.env.EMAIL_FROM || 'Dog Food 2 My Door <orders@dogfood2mydoor.com>'

/** Subject, HTML and text of the store's copy of a saved order. */
export async function buildNewOrderEmail(orderId: string) {
  const admin = createAdminClient()
  if (!admin) throw new Error('Supabase is not configured')
  const [{ data: order, error }, settings] = await Promise.all([
    admin.from('orders').select('*, order_items(*)').eq('id', orderId).single(),
    getSettings()
  ])
  if (error) throw error
  const o = order as OrderWithItems
  const live = process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_')
  const deliveryDate = o.delivery_date ? formatDeliveryDate(o.delivery_date) : null
  const contact = settings?.contact

  const { html, text } = await renderNewOrderEmail({
    store: {
      siteUrl: siteOrigin(),
      phone: formatPhone(contact?.phone ?? '702-971-2484'),
      email: contact?.email ?? STORE_EMAIL,
      address: contact?.address ?? '1550 W. Horizon Ridge Pkwy, Suite N\nHenderson, NV 89012'
    },
    order: {
      number: o.number,
      kind: o.kind,
      fulfillment: o.fulfillment,
      deliveryDate,
      requestedTime: o.requested_time ? `around ${formatSlot(o.requested_time)}` : null,
      address: o.address,
      notes: o.notes,
      customerName: o.customer_name,
      email: o.email,
      phone: o.phone ? formatPhone(o.phone) : null,
      autoshipSchedule: o.autoship_schedule,
      items: o.order_items.map((i) => ({
        title: i.title,
        option: i.option,
        quantity: i.quantity,
        unitAmount: i.unit_amount,
        autoship: i.autoship
      })),
      subtotal: o.subtotal,
      discount: o.discount,
      tax: o.tax,
      total: o.total
    },
    stripeUrl: o.stripe_customer_id
      ? `https://dashboard.stripe.com/${live ? '' : 'test/'}customers/${o.stripe_customer_id}`
      : null
  })

  const kind = o.kind === 'autoship_renewal' ? 'Autoship renewal' : 'New order'
  const how = o.fulfillment === 'pickup' ? 'Pickup' : 'Delivery'
  const subject = `${kind} #${o.number}${deliveryDate ? ` · ${how} ${deliveryDate}` : ''}${live ? '' : ' (test)'}`
  return { subject, html, text, replyTo: o.email || undefined }
}

/**
 * Emails the new order to the store through Resend. Called once, right after the webhook saves
 * a new order (Stripe's retries find it already saved and don't get here). Never throws: a
 * missing email mustn't make Stripe retry the webhook; the order is in Supabase either way.
 */
export async function sendNewOrderEmail(orderId: string) {
  const key = process.env.RESEND_API_KEY
  if (!key) return { skipped: 'email_not_configured' as const }
  try {
    const { subject, html, text, replyTo } = await buildNewOrderEmail(orderId)
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `new-order-${orderId}`
      },
      body: JSON.stringify({
        from: FROM,
        to: [STORE_EMAIL],
        reply_to: replyTo,
        subject,
        html,
        text
      })
    })
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`)
    return { sent: true as const }
  } catch (error) {
    console.error(`new-order email for ${orderId} failed`, error)
    return { failed: true as const }
  }
}
