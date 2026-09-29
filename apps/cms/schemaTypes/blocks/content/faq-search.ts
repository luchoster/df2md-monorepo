import { SearchIcon } from '@sanity/icons/Search'
import { defineArrayMember, defineField, defineType } from 'sanity'
import { paddingField } from '../shared'

/** shadcnblocks FAQ 28: centered accordion with a live search box. */
export default defineType({
  name: 'faq-search',
  title: 'FAQ with search',
  type: 'object',
  icon: SearchIcon,
  fields: [
    defineField({ name: 'label', type: 'string', initialValue: 'FAQ' }),
    defineField({ name: 'heading', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'description', type: 'text', rows: 2 }),
    defineField({
      name: 'searchPlaceholder',
      type: 'string',
      initialValue: 'Search questions...'
    }),
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
    defineField({
      name: 'emptyText',
      title: 'No results text',
      description: 'Shown when a search matches nothing; the contact email is added after it',
      type: 'string',
      initialValue: 'Try different keywords or email us at'
    }),
    paddingField
  ],
  preview: {
    select: { heading: 'heading', items: 'items' },
    prepare: ({ heading, items }) => ({
      title: heading,
      subtitle: `FAQ with search · ${items?.length ?? 0} questions`
    })
  }
})
