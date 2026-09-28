import { HelpCircleIcon } from '@sanity/icons'
import { defineArrayMember, defineField, defineType } from 'sanity'
import { paddingField } from '../shared'

export default defineType({
  name: 'faq-list',
  title: 'FAQ list',
  type: 'object',
  icon: HelpCircleIcon,
  fields: [
    defineField({ name: 'heading', type: 'string' }),
    defineField({
      name: 'items',
      type: 'array',
      validation: (rule) => rule.min(1),
      of: [
        defineArrayMember({
          name: 'faq',
          type: 'object',
          fields: [
            defineField({
              name: 'question',
              type: 'string',
              validation: (rule) => rule.required()
            }),
            defineField({
              name: 'answer',
              type: 'simple-content',
              validation: (rule) => rule.required()
            })
          ],
          preview: { select: { title: 'question' } }
        })
      ]
    }),
    paddingField
  ],
  preview: {
    select: { heading: 'heading', items: 'items' },
    prepare: ({ heading, items }) => ({
      title: heading || `${items?.length ?? 0} questions`,
      subtitle: 'FAQ list'
    })
  }
})
