import { z } from 'zod'

/** What the checkout form posts. Prices are NOT accepted from the client. */
export const checkoutRequestSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(100),
        variantKey: z.string().min(1).max(50),
        quantity: z.number().int().min(1).max(99),
        autoship: z.boolean()
      })
    )
    .min(1)
    .max(50),
  schedule: z.object({
    interval: z.enum(['day', 'week', 'month']),
    count: z.number().int().min(1).max(365)
  }),
  customer: z.object({
    name: z.string().trim().min(2, 'Please enter your name').max(120),
    email: z.email('Please enter a valid email').max(200),
    phone: z.string().trim().min(7, 'Please enter a phone number').max(30)
  }),
  fulfillment: z.discriminatedUnion('method', [
    z.object({
      method: z.literal('delivery'),
      address: z.object({
        line1: z.string().trim().min(3, 'Street address is required').max(200),
        line2: z.string().trim().max(200).optional(),
        city: z.string().trim().min(2, 'City is required').max(100),
        state: z.string().trim().length(2).default('NV'),
        postalCode: z
          .string()
          .trim()
          .regex(/^\d{5}(-\d{4})?$/, 'Enter a 5-digit ZIP code')
      }),
      requestedTime: z
        .string()
        .regex(/^\d{2}:\d{2}$/)
        .optional(),
      notes: z.string().trim().max(500).optional()
    }),
    z.object({ method: z.literal('pickup'), notes: z.string().trim().max(500).optional() })
  ])
})

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>

export type CheckoutLine = {
  productId: string
  variantKey: string
  title: string
  option: string
  unitAmount: number
  quantity: number
  autoship: boolean
  noDiscounts: boolean
}

export type CheckoutQuote = {
  lines: CheckoutLine[]
  subtotal: number
  discount: number
  tax: number
  total: number
  discountPercent: number
  taxRatePercent: number
  deliveryDate: string
  firstAutoship: boolean
}

export type CheckoutResponse =
  | { ok: true; url: string }
  | { ok: false; error: 'invalid'; issues: { path: string; message: string }[] }
  | { ok: false; error: 'cart_changed'; message: string; problems: string[] }
  | { ok: false; error: 'payments_not_configured'; quote: CheckoutQuote }
  | { ok: false; error: 'server'; message: string }
