import { TagIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'
import { imageField } from './image'

/**
 * One purchasable size/flavor of a product. Inline in `product.variants[]` with
 * `_key = 'v<wpVariationId>'` so re-running the import patches in place.
 * The Stripe block is written by scripts/import/src/05-stripe-sync.ts, never by editors.
 */
export default defineType({
  name: 'variant',
  title: 'Variant',
  type: 'object',
  icon: TagIcon,
  fieldsets: [
    {
      name: 'shipping',
      title: 'Shipping',
      options: { collapsible: true, collapsed: true, columns: 2 }
    },
    { name: 'integrations', title: 'Integrations', options: { collapsible: true, collapsed: true } }
  ],
  fields: [
    defineField({
      name: 'option',
      title: 'Option label',
      description: 'Shown in the size dropdown, e.g. "4 lbs"',
      type: 'string',
      validation: (rule) => rule.required()
    }),
    defineField({ name: 'sku', title: 'SKU', type: 'string' }),
    defineField({
      name: 'price',
      title: 'Price (USD)',
      type: 'number',
      validation: (rule) => rule.required().min(0).precision(2)
    }),
    defineField({
      name: 'compareAtPrice',
      title: 'Regular price (when on sale)',
      type: 'number',
      validation: (rule) =>
        rule
          .min(0)
          .precision(2)
          .custom((value, ctx) => {
            const price = (ctx.parent as { price?: number } | undefined)?.price
            return value == null || price == null || value > price
              ? true
              : 'Must be higher than the price'
          })
    }),
    defineField({ name: 'inStock', type: 'boolean', initialValue: true }),
    defineField({ name: 'stockQty', title: 'Stock quantity', type: 'number' }),
    defineField({ name: 'weightLbs', title: 'Weight (lbs)', type: 'number', fieldset: 'shipping' }),
    defineField({
      name: 'dimensionsIn',
      title: 'Dimensions (in)',
      type: 'object',
      fieldset: 'shipping',
      options: { columns: 3 },
      fields: ['l', 'w', 'h'].map((name) => defineField({ name, type: 'number' }))
    }),
    imageField({ name: 'image', altRequired: false }),
    defineField({ name: 'note', type: 'text', rows: 2 }),
    defineField({
      name: 'stripe',
      type: 'object',
      fieldset: 'integrations',
      readOnly: true,
      fields: [
        defineField({ name: 'productId', type: 'string' }),
        defineField({ name: 'priceId', type: 'string' }),
        defineField({ name: 'syncedAt', type: 'datetime' })
      ]
    }),
    defineField({
      name: 'lightspeed',
      type: 'object',
      fieldset: 'integrations',
      description: 'Reserved for the Lightspeed POS sync (P7)',
      fields: [
        defineField({ name: 'itemId', type: 'string' }),
        defineField({ name: 'shopId', type: 'string' })
      ]
    })
  ],
  preview: {
    select: { option: 'option', price: 'price', sku: 'sku', inStock: 'inStock', media: 'image' },
    prepare: ({ option, price, sku, inStock, media }) => ({
      title: option,
      subtitle: [
        price != null ? `$${Number(price).toFixed(2)}` : 'no price',
        sku,
        inStock === false ? 'OUT OF STOCK' : null
      ]
        .filter(Boolean)
        .join(' · '),
      media
    })
  }
})
