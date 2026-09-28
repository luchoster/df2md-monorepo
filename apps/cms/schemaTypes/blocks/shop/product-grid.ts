import { ThLargeIcon } from '@sanity/icons'
import { defineArrayMember, defineField, defineType } from 'sanity'
import { paddingField } from '../shared'

export default defineType({
  name: 'product-grid',
  title: 'Product grid',
  type: 'object',
  icon: ThLargeIcon,
  fields: [
    defineField({ name: 'heading', type: 'string' }),
    defineField({
      name: 'source',
      type: 'string',
      initialValue: 'featured',
      options: {
        list: [
          { title: 'Featured products', value: 'featured' },
          { title: 'From a category', value: 'category' },
          { title: 'Hand-picked', value: 'manual' }
        ],
        layout: 'radio'
      },
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'category',
      type: 'reference',
      to: [{ type: 'category' }],
      hidden: ({ parent }) => parent?.source !== 'category',
      validation: (rule) =>
        rule.custom((value, ctx) =>
          (ctx.parent as { source?: string })?.source === 'category' && !value
            ? 'Pick a category'
            : true
        )
    }),
    defineField({
      name: 'products',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'product' }] })],
      hidden: ({ parent }) => parent?.source !== 'manual',
      validation: (rule) => rule.unique()
    }),
    defineField({
      name: 'limit',
      type: 'number',
      initialValue: 12,
      validation: (rule) => rule.min(1).max(48),
      hidden: ({ parent }) => parent?.source === 'manual'
    }),
    defineField({
      name: 'layout',
      type: 'string',
      initialValue: 'carousel',
      options: { list: ['grid', 'carousel'], layout: 'radio', direction: 'horizontal' }
    }),
    paddingField
  ],
  preview: {
    select: { heading: 'heading', source: 'source', category: 'category.title' },
    prepare: ({ heading, source, category }) => ({
      title: heading || 'Products',
      subtitle: `Product grid · ${source === 'category' ? category : source}`
    })
  }
})
