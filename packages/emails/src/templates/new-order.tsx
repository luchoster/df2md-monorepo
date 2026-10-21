import { Button, Column, Heading, Hr, Link, Row, Section, Text } from '@react-email/components'
import { brand, Layout, type Store } from '../components/layout'

export type NewOrderItem = {
  title: string
  option: string | null
  quantity: number
  /** cents */
  unitAmount: number
  autoship: boolean
}

export type NewOrderEmailProps = {
  store: Store
  order: {
    number: number
    kind: 'order' | 'autoship_renewal'
    fulfillment: 'delivery' | 'pickup'
    /** Already formatted: "Thursday, October 23" */
    deliveryDate: string | null
    /** Already formatted: "around 2:00 pm" */
    requestedTime: string | null
    address: string | null
    notes: string | null
    customerName: string | null
    email: string
    phone: string | null
    autoshipSchedule: string | null
    items: NewOrderItem[]
    /** cents */
    subtotal: number
    discount: number
    tax: number
    total: number
  }
  /** Stripe dashboard page for the customer */
  stripeUrl: string | null
}

const money = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)

const label = { color: brand.body, fontSize: 12, textTransform: 'uppercase' as const, margin: 0 }
const value = { color: brand.ink, fontSize: 15, lineHeight: '22px', margin: '2px 0 14px' }
const cell = { color: brand.ink, fontSize: 14, lineHeight: '20px', margin: 0 }

/** To the store (info@): everything needed to pack and deliver the order. */
export function NewOrderEmail({ store, order, stripeUrl }: NewOrderEmailProps) {
  const renewal = order.kind === 'autoship_renewal'
  const pickup = order.fulfillment === 'pickup'
  const title = `${renewal ? 'Autoship renewal' : 'New order'} #${order.number}`
  const when = [order.deliveryDate, order.requestedTime].filter(Boolean).join(', ')
  return (
    <Layout
      store={store}
      preview={`${title}: ${money(order.total)}, ${pickup ? 'pickup' : 'delivery'} ${when}`}
    >
      <Heading as="h1" style={{ color: brand.ink, fontSize: 24, margin: '0 0 4px' }}>
        {title}
      </Heading>
      <Text style={{ color: brand.body, fontSize: 15, margin: '0 0 20px' }}>
        {money(order.total)} paid
        {order.autoshipSchedule ? ` · Autoship ${order.autoshipSchedule.toLowerCase()}` : ''}
      </Text>

      <Section
        style={{
          backgroundColor: '#e6f7ee',
          border: `1px solid ${brand.green}`,
          borderRadius: 8,
          padding: '14px 16px',
          marginBottom: 20
        }}
      >
        <Text style={{ ...label, color: brand.green, fontWeight: 700 }}>
          {pickup ? 'Store pickup' : 'Delivery'}
        </Text>
        <Text style={{ ...value, fontSize: 18, fontWeight: 700, margin: '4px 0 0' }}>
          {when || 'Date to be confirmed'}
        </Text>
        {!pickup && order.address && (
          <Text style={{ ...value, margin: '6px 0 0' }}>
            <Link
              href={`https://maps.google.com/?q=${encodeURIComponent(order.address)}`}
              style={{ color: brand.ink }}
            >
              {order.address}
            </Link>
          </Text>
        )}
        {order.notes && (
          <Text style={{ ...value, margin: '6px 0 0' }}>
            <strong>Notes:</strong> {order.notes}
          </Text>
        )}
      </Section>

      <Row>
        <Column style={{ width: '50%', verticalAlign: 'top' }}>
          <Text style={label}>Customer</Text>
          <Text style={value}>{order.customerName || '—'}</Text>
        </Column>
        <Column style={{ width: '50%', verticalAlign: 'top' }}>
          <Text style={label}>Contact</Text>
          <Text style={value}>
            {order.phone && (
              <>
                <Link href={`tel:${order.phone.replace(/\D/g, '')}`} style={{ color: brand.sky }}>
                  {order.phone}
                </Link>
                <br />
              </>
            )}
            <Link href={`mailto:${order.email}`} style={{ color: brand.sky }}>
              {order.email}
            </Link>
          </Text>
        </Column>
      </Row>

      <Hr style={{ borderColor: brand.line, margin: '8px 0 12px' }} />

      {order.items.map((item, i) => (
        <Row key={`${item.title}-${i}`} style={{ marginBottom: 10 }}>
          <Column style={{ verticalAlign: 'top' }}>
            <Text style={{ ...cell, fontWeight: 700 }}>
              {item.quantity} × {item.title}
            </Text>
            <Text style={{ ...cell, color: brand.body, fontSize: 13 }}>
              {[item.option, item.autoship && 'Autoship'].filter(Boolean).join(' · ')}
            </Text>
          </Column>
          <Column style={{ width: 90, verticalAlign: 'top', textAlign: 'right' }}>
            <Text style={cell}>{money(item.unitAmount * item.quantity)}</Text>
          </Column>
        </Row>
      ))}

      <Hr style={{ borderColor: brand.line, margin: '4px 0 12px' }} />

      {(
        [
          ['Subtotal', order.subtotal],
          order.discount > 0 ? ['Discount', -order.discount] : null,
          [pickup ? 'Pickup' : 'Delivery', 0],
          ['Tax', order.tax]
        ].filter(Boolean) as [string, number][]
      ).map(([name, amount]) => (
        <Row key={name}>
          <Column>
            <Text style={{ ...cell, color: brand.body }}>{name}</Text>
          </Column>
          <Column style={{ textAlign: 'right' }}>
            <Text style={{ ...cell, color: amount < 0 ? brand.green : brand.ink }}>
              {amount === 0 && name !== 'Tax'
                ? 'Free'
                : amount < 0
                  ? `−${money(-amount)}`
                  : money(amount)}
            </Text>
          </Column>
        </Row>
      ))}
      <Row style={{ marginTop: 8 }}>
        <Column>
          <Text style={{ ...cell, fontSize: 16, fontWeight: 700 }}>Total</Text>
        </Column>
        <Column style={{ textAlign: 'right' }}>
          <Text style={{ ...cell, fontSize: 16, fontWeight: 700 }}>{money(order.total)}</Text>
        </Column>
      </Row>

      {stripeUrl && (
        <Section style={{ marginTop: 24 }}>
          <Button
            href={stripeUrl}
            style={{
              backgroundColor: brand.green,
              color: '#ffffff',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 700,
              padding: '12px 20px'
            }}
          >
            Open the customer in Stripe
          </Button>
        </Section>
      )}
    </Layout>
  )
}

NewOrderEmail.PreviewProps = {
  store: {
    siteUrl: 'https://df2md.zera.us',
    phone: '(702) 971-2484',
    email: 'info@dogfood2mydoor.com',
    address: '1550 W. Horizon Ridge Pkwy, Suite N\nHenderson, NV 89012'
  },
  order: {
    number: 1042,
    kind: 'order',
    fulfillment: 'delivery',
    deliveryDate: 'Thursday, October 23',
    requestedTime: 'around 2:00 pm',
    address: '123 Example St, Henderson, NV 89012',
    notes: 'Leave by the side gate',
    customerName: 'Sample Customer',
    email: 'customer@example.com',
    phone: '(702) 555-0100',
    autoshipSchedule: 'Every 4 weeks',
    items: [
      {
        title: 'Orijen Original Dry Dog Food',
        option: '23.5 lbs',
        quantity: 1,
        unitAmount: 11999,
        autoship: true
      },
      {
        title: 'Redbarn Cow Hoove',
        option: 'Single',
        quantity: 2,
        unitAmount: 299,
        autoship: false
      }
    ],
    subtotal: 12597,
    discount: 2400,
    tax: 851,
    total: 11048
  },
  stripeUrl: 'https://dashboard.stripe.com/test/customers/cus_example'
} satisfies NewOrderEmailProps

export default NewOrderEmail
