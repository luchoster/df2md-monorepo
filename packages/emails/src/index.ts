import { render } from '@react-email/components'
import { NewOrderEmail, type NewOrderEmailProps } from './templates/new-order'

export type { Store } from './components/layout'
export type { NewOrderEmailProps, NewOrderItem } from './templates/new-order'
export { NewOrderEmail }

/** HTML and plain-text versions, ready for Resend. */
export async function renderNewOrderEmail(props: NewOrderEmailProps) {
  const element = NewOrderEmail(props)
  const [html, text] = await Promise.all([render(element), render(element, { plainText: true })])
  return { html, text }
}
