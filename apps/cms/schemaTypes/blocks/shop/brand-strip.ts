import { StarIcon } from '@sanity/icons/Star'
import { defineArrayMember, defineField, defineType } from 'sanity'
import { paddingField } from '../shared'

export default defineType({
  name: 'brand-strip',
  title: 'Brand strip',
  type: 'object',
  icon: StarIcon,
  fields: [
    defineField({ name: 'heading', type: 'string' }),
    defineField({
      name: 'showAll',
      title: 'Show all featured brands',
      type: 'boolean',
      initialValue: true
    }),
    defineField({
      name: 'brands',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'brand' }] })],
      hidden: ({ parent }) => parent?.showAll,
      validation: (rule) => rule.unique()
    }),
    defineField({
      name: 'linkToShop',
      title: 'Link logos to the shop filtered by brand',
      type: 'boolean',
      initialValue: true
    }),
    paddingField
  ],
  preview: {
    select: { heading: 'heading' },
    prepare: ({ heading }) => ({ title: heading || 'Brands', subtitle: 'Brand strip' })
  }
})
